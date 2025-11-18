// api/src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import formbody from "@fastify/formbody";
import { OAuthApp } from "@octokit/oauth-app";
import { Octokit } from "@octokit/rest";
import { prisma } from "./prisma"; // create api/src/prisma.ts exporting new PrismaClient()
import { addDays, eachDayOfInterval, isAfter, isBefore } from "date-fns";

const app = Fastify({ logger: true });

//helpers
function requireUser(req: any) {
  const uid = req.session?.uid;
  if (!uid) {
    const err: any = new Error("not authenticated");
    err.statusCode = 401;
    throw err;
  }
  return uid as string;
}

async function getOctokit(uid: string) {
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    const err: any = new Error("no user");
    err.statusCode = 401;
    throw err;
  }
  return new Octokit({ auth: user.accessToken });
}

const oauth = new OAuthApp({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

//boot
async function start() {
  await app.register(cookie, { secret: process.env.SESSION_SECRET ?? "0123456789abcdef0123456789abcdef" });
  await app.register(session, {
    secret: process.env.SESSION_SECRET ?? "0123456789abcdef0123456789abcdef",
    cookie: { secure: false },
  });
  await app.register(formbody);

  // optional root for quick check
  app.get("/", async () => ({ ok: true, routes: ["/healthz", "/auth/github", "/me", "/repos"] }));
  app.get("/healthz", async () => ({ ok: true }));

  // OAuth
  app.get("/auth/github", async (_req, reply) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo%20read:org`;
    reply.redirect(url);
  });

  app.get("/auth/github/callback", async (req, reply) => {
    const code = (req.query as any)?.code;
    if (!code) return reply.code(400).send({ error: "missing code" });

    const { authentication } = await oauth.createToken({ code });
    const token = authentication.token;

    const octo = new Octokit({ auth: token });
    const { data: me } = await octo.rest.users.getAuthenticated();

    const user = await prisma.user.upsert({
      where: { githubId: me.id },
      create: { githubId: me.id, login: me.login, accessToken: token },
      update: { login: me.login, accessToken: token },
    });

    (req.session as any).uid = user.id;
    reply.redirect("/me");
  });

  app.get("/me", async (req, reply) => {
    const uid = (req.session as any).uid;
    if (!uid) return reply.code(401).send({ error: "not authenticated" });
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return reply.code(401).send({ error: "no user" });
    return { id: user.id, login: user.login };
  });

  // repos
  app.get("/repos", async (req, _reply) => {
    const uid = requireUser(req);
    const octo = await getOctokit(uid);
    const repos = await octo.paginate(octo.rest.repos.listForAuthenticatedUser, { per_page: 100 });
    return repos.map(r => ({ id: r.id, owner: r.owner?.login, name: r.name, private: r.private }));
  });

  // body: { owner, name, githubRepoId }
  app.post("/track", async (req, reply) => {
    const uid = requireUser(req);
    const { owner, name, githubRepoId } = (req.body as any) ?? {};
    if (!owner || !name || !githubRepoId) return reply.code(400).send({ error: "owner, name, githubRepoId required" });

    const repo = await prisma.repo.upsert({
      where: { githubId: Number(githubRepoId) },
      create: { githubId: Number(githubRepoId), owner, name, userId: uid },
      update: { owner, name, userId: uid },
    });
    return { ok: true, repoId: repo.id };
  });

  // sync issues
  app.post("/sync/:owner/:name", async (req, reply) => {
    const uid = requireUser(req);
    const { owner, name } = req.params as any;

    const repo = await prisma.repo.findFirst({ where: { owner, name, userId: uid } });
    if (!repo) return reply.code(404).send({ error: "repo not tracked" });

    const octo = await getOctokit(uid);
    const issues = await octo.paginate(octo.rest.issues.listForRepo, { owner, repo: name, state: "all", per_page: 100 });

    let upserts = 0;
    for (const is of issues) {
      // skip PRs
      if ((is as any).pull_request) continue;

      const labels = (is.labels ?? []).map((l: any) => (typeof l === "string" ? l : l.name)).filter(Boolean) as string[];
      const ptsLabel = labels.find(l => /^pts:\d+$/i.test(l));
      const points = ptsLabel ? parseInt(ptsLabel.split(":")[1], 10) : null;

      await prisma.issue.upsert({
        where: { repoId_number: { 
          repoId: repo.id, number: is.number } },
        create: {
          repoId: repo.id,
          number: is.number,
          state: is.state,
          createdAt: new Date(is.created_at),
          closedAt: is.closed_at ? new Date(is.closed_at) : null,
          labels,
          points,
        },
        update: {
          state: is.state,
          closedAt: is.closed_at ? new Date(is.closed_at) : null,
          labels,
          points,
        },
      });
      upserts++;
    }

    return { ok: true, upserts };
  });

  // metrics 
  app.get("/metrics/:owner/:name", async (req, reply) => {
    const uid = requireUser(req);
    const { owner, name } = req.params as any;
    const { start, end } = req.query as any;

    const repo = await prisma.repo.findFirst({ where: { owner, name, userId: uid } });
    if (!repo) return reply.code(404).send({ error: "repo not tracked" });

    const s = start ? new Date(start) : addDays(new Date(), -13);
    const e = end ? new Date(end) : new Date();

    const issues = await prisma.issue.findMany({ where: { repoId: repo.id } });
    const days = eachDayOfInterval({ start: s, end: e });

    const burndown = days.map((d: Date) => {
      const remaining = issues.filter(i =>
        isBefore(new Date(i.createdAt), addDays(d, 1)) &&
        (!i.closedAt || isAfter(new Date(i.closedAt), d))
      ).length;
      return { date: d.toISOString().slice(0, 10), remaining };
    });

    const velocity = issues
      .filter(i => i.closedAt && !isBefore(new Date(i.closedAt), s) && !isAfter(new Date(i.closedAt), e))
      .reduce((sum, i) => sum + (i.points ?? 1), 0);

    return { burndown, velocity };
  });

  // errors
  app.setErrorHandler((err, _req, reply) => {
    const code = (err as any).statusCode ?? 500;
    app.log.error(err);
    reply.code(code).send({ error: err.message });
  });

  const PORT = Number(process.env.PORT ?? 3000);
  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on ${address}`);
}

  // open issues 
  app.get("/issues/:owner/:name/open", async (req, reply) => {
    const uid = requireUser(req);
    const { owner, name } = req.params as any;
    const repo = await prisma.repo.findFirst({ where: { owner, name, userId: uid } });
    if (!repo) return reply.code(404).send({ error: "repo not tracked"});

    const openIssues = await prisma.issue.findMany({
      where: { repoId: repo.id, state: "open"},
      orderBy: { createdAt: "desc" },
      select: { number: true, state: true, labels: true, points: true, createdAt: true },

    });
    return openIssues;
  });

start();

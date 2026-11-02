// Docker course outline. Only lessons with `live: true` have a page yet.

export type Lesson = {
  id: string; // "02.03"
  title: string;
  minutes: number;
  tag?: "CODE" | "BUILD" | "CONCEPT";
  slug?: string;
  live?: boolean;
};

export type Module = { n: string; title: string; blurb: string; lessons: Lesson[] };

const l = (id: string, title: string, minutes: number, tag?: Lesson["tag"], slug?: string): Lesson => ({
  id,
  title,
  minutes,
  tag,
  slug,
  live: Boolean(slug),
});

export const modules: Module[] = [
  {
    n: "01",
    title: "Foundations",
    blurb: "What a container actually is, and why it beat the alternatives.",
    lessons: [
      l("01.01", "Why containers exist", 9, "CONCEPT", "why-containers-exist"),
      l("01.02", "Containers vs virtual machines", 11, "CONCEPT", "containers-vs-virtual-machines"),
      l("01.03", "Under the hood: namespaces and cgroups", 16, "CODE", "namespaces-and-cgroups"),
      l("01.04", "Images, containers, registries", 12, "CODE", "images-containers-registries"),
      l("01.05", "Install Docker and run your first container", 12, "CODE", "install-and-first-container"),
      l("01.06", "The Docker CLI, mapped", 12, "CODE", "docker-cli-mapped"),
    ],
  },
  {
    n: "02",
    title: "Images",
    blurb: "Write Dockerfiles that build fast, stay small and cache well.",
    lessons: [
      l("02.01", "Your first Dockerfile", 14, "CODE", "your-first-dockerfile"),
      l("02.02", "Layers and the build cache", 14, "CODE", "layers-and-build-cache"),
      l("02.03", "Build context and .dockerignore", 9, "CODE", "build-context-and-dockerignore"),
      l("02.04", "Multi-stage builds", 13, "CODE", "multi-stage-builds"),
      l("02.05", "Making images small", 11, "CODE", "making-images-small"),
      l("02.06", "Tags, digests and registries", 12, "CODE", "tags-digests-and-registries"),
      l("02.07", "Choosing a base image", 10, "CONCEPT", "choosing-a-base-image"),
      l("02.08", "Project: containerise the API", 25, "BUILD", "project-containerise-the-api"),
    ],
  },
  {
    n: "03",
    title: "Running containers",
    blurb: "Lifecycle, ports, config, logs and limits.",
    lessons: [
      l("03.01", "The container lifecycle", 10, "CODE", "container-lifecycle"),
      l("03.02", "Publishing ports", 9, "CODE", "publishing-ports"),
      l("03.03", "Environment variables and config", 10, "CODE", "environment-and-config"),
      l("03.04", "Logs and exec", 10, "CODE", "logs-and-exec"),
      l("03.05", "Restart policies", 9, "CODE", "restart-policies"),
      l("03.06", "CPU and memory limits", 11, "CODE", "cpu-and-memory-limits"),
      l("03.07", "Healthchecks (project step 2)", 14, "BUILD", "healthchecks"),
    ],
  },
  {
    n: "04",
    title: "Data",
    blurb: "Where data lives when containers come and go.",
    lessons: [
      l("04.01", "The writable layer is temporary", 8, "CODE", "writable-layer"),
      l("04.02", "Volumes", 12, "CODE", "volumes"),
      l("04.03", "Bind mounts", 11, "CODE", "bind-mounts"),
      l("04.04", "tmpfs mounts", 7, "CODE", "tmpfs-mounts"),
      l("04.05", "Project: persist Postgres", 25, "BUILD", "project-persist-postgres"),
    ],
  },
  {
    n: "05",
    title: "Networking",
    blurb: "How containers find and talk to each other.",
    lessons: [
      l("05.01", "How container networking works", 11, "CODE", "how-container-networking-works"),
      l("05.02", "User-defined bridges and DNS", 12, "CODE", "user-defined-networks"),
      l("05.03", "Host and none networks", 9, "CODE", "host-and-none-networks"),
      l("05.04", "Debugging network problems", 13, "CODE", "debugging-network-problems"),
      l("05.05", "Project: wire the services together", 25, "BUILD", "project-wire-the-services"),
    ],
  },
  {
    n: "06",
    title: "Compose",
    blurb: "One file, one command, the whole stack.",
    lessons: [
      l("06.01", "Anatomy of a compose file", 10, "CODE"),
      l("06.02", "Multi-service apps", 12, "CODE"),
      l("06.03", "Startup order and healthchecks", 9, "CODE"),
      l("06.04", "Env files and profiles", 8, "CODE"),
      l("06.05", "A dev loop with compose watch", 10, "CODE"),
      l("06.06", "Project: one-command dev environment", 25, "BUILD"),
    ],
  },
  {
    n: "07",
    title: "Production",
    blurb: "Secure, reproducible images and a pipeline that ships them.",
    lessons: [
      l("07.01", "Run as non-root", 9, "CODE"),
      l("07.02", "Secrets without leaks", 11, "CODE"),
      l("07.03", "Scanning images", 8, "CODE"),
      l("07.04", "Multi-platform builds", 10, "CODE"),
      l("07.05", "Build cache in CI", 9, "CODE"),
      l("07.06", "Project: ship with GitHub Actions", 30, "BUILD"),
      l("07.07", "Project: deploy to a VPS", 30, "BUILD"),
    ],
  },
  {
    n: "08",
    title: "Beyond Docker",
    blurb: "The standards and runtimes underneath, and where to go next.",
    lessons: [
      l("08.01", "OCI: the image and runtime specs", 10, "CONCEPT"),
      l("08.02", "containerd and runc", 11, "CONCEPT"),
      l("08.03", "Rootless containers and Podman", 9, "CODE"),
      l("08.04", "From Compose to Kubernetes", 12, "CONCEPT"),
    ],
  },
];

export const allLessons = modules.flatMap((m) => m.lessons.map((lesson) => ({ ...lesson, module: m })));

export const lessonById = (id: string) => allLessons.find((x) => x.id === id);

export const stats = {
  modules: modules.length,
  lessons: allLessons.length,
  hours: Math.round(allLessons.reduce((sum, x) => sum + x.minutes, 0) / 60),
};

export const projectSteps = [
  { tag: "docker-step-01", title: "Containerise the API", after: "02", detail: "A multi-stage Dockerfile for the notes API, built and pushed to a registry." },
  { tag: "docker-step-02", title: "Configure and health-check it", after: "03", detail: "Env-based config, a healthcheck and sensible limits." },
  { tag: "docker-step-03", title: "Persist Postgres", after: "04", detail: "Notes move to Postgres 18 on a named volume, with a tested dump and restore." },
  { tag: "docker-step-04", title: "Wire the services together", after: "05", detail: "Nginx in front, a Redis cache, and separate public and private networks." },
  { tag: "docker-step-05", title: "One-command dev environment", after: "06", detail: "docker compose up with hot reload and seeded data." },
  { tag: "docker-step-06", title: "Ship from CI", after: "07", detail: "GitHub Actions builds, scans and pushes to GHCR." },
  { tag: "docker-step-07", title: "Deploy to a VPS", after: "07", detail: "Pull, migrate and roll forward with healthchecks." },
];

export type InterviewQ = {
  q: string;
  level: "Junior" | "Mid" | "Senior";
  frequency: 1 | 2 | 3 | 4;
  importance: "Must-know" | "Good to know";
  kind: "Concept" | "Scenario" | "Debugging" | "Design";
  lesson?: string;
};

export const interviewSample: InterviewQ[] = [
  { q: "What is the difference between a container and a virtual machine?", level: "Junior", frequency: 4, importance: "Must-know", kind: "Concept", lesson: "01.02" },
  { q: "Every code change re-runs npm install during the build. Why, and how do you fix it?", level: "Mid", frequency: 3, importance: "Must-know", kind: "Debugging", lesson: "02.02" },
  { q: "CMD vs ENTRYPOINT: when would you use both together?", level: "Mid", frequency: 3, importance: "Must-know", kind: "Concept", lesson: "02.01" },
  { q: "How do you keep secrets out of an image's layers?", level: "Senior", frequency: 2, importance: "Must-know", kind: "Scenario", lesson: "07.02" },
  { q: "Two services on the same Compose network can't reach each other by name. Walk me through debugging it.", level: "Senior", frequency: 2, importance: "Good to know", kind: "Debugging", lesson: "05.04" },
];

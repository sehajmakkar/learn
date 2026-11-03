// Docker course outline. Only lessons with a slug have a page yet.
import { siDocker } from "simple-icons";
import { l, type Course, type Module, type ProjectStep } from "@/lib/courses/types";

const modules: Module[] = [
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
      l("06.01", "Anatomy of a compose file", 11, "CODE", "compose-file-anatomy"),
      l("06.02", "Multi-service apps", 11, "CODE", "multi-service-apps"),
      l("06.03", "Startup order and healthchecks", 10, "CODE", "startup-order-and-healthchecks"),
      l("06.04", "Env files and profiles", 11, "CODE", "env-files-and-profiles"),
      l("06.05", "A dev loop with compose watch", 12, "CODE", "compose-watch"),
      l("06.06", "Project: one-command dev environment", 25, "BUILD", "project-one-command-dev"),
    ],
  },
  {
    n: "07",
    title: "Production",
    blurb: "Secure, reproducible images and a pipeline that ships them.",
    lessons: [
      l("07.01", "Run as non-root", 12, "CODE", "run-as-non-root"),
      l("07.02", "Secrets without leaks", 13, "CODE", "secrets-without-leaks"),
      l("07.03", "Scanning images", 12, "CODE", "scanning-images"),
      l("07.04", "Multi-platform builds", 10, "CODE", "multi-platform-builds"),
      l("07.05", "Build cache in CI", 11, "CODE", "build-cache-in-ci"),
      l("07.06", "Project: ship with GitHub Actions", 30, "BUILD", "project-ship-with-github-actions"),
      l("07.07", "Project: deploy to a VPS", 35, "BUILD", "project-deploy-to-a-vps"),
    ],
  },
];

const projectSteps: ProjectStep[] = [
  { tag: "docker-step-01", title: "Containerise the API", after: "02", detail: "A multi-stage Dockerfile for the notes API, built and pushed to a registry." },
  { tag: "docker-step-02", title: "Configure and health-check it", after: "03", detail: "Env-based config, a healthcheck and sensible limits." },
  { tag: "docker-step-03", title: "Persist Postgres", after: "04", detail: "Notes move to Postgres 18 on a named volume, with a tested dump and restore." },
  { tag: "docker-step-04", title: "Wire the services together", after: "05", detail: "Nginx in front, a Redis cache, and separate public and private networks." },
  { tag: "docker-step-05", title: "One-command dev environment", after: "06", detail: "docker compose up --watch: healthy startup order, seeded data and hot reload." },
  { tag: "docker-step-06", title: "Ship from CI", after: "07", detail: "GitHub Actions builds, scans with Trivy and publishes amd64 + arm64 images to GHCR." },
  { tag: "docker-step-07", title: "Deploy to a VPS", after: "07", detail: "A hardened production compose file, secrets from files, deploys and rollbacks by tag." },
];

export const docker: Course = {
  id: "docker",
  title: "Docker",
  status: "live",
  logo: { title: siDocker.title, hex: siDocker.hex, path: siDocker.path },
  heroLabel: "docker",
  kicker: "Course 01 · Docker · v1",
  headline: ["Docker, from ", "first principles", "."],
  description:
    "Start with what a container really is. Finish by shipping a four-service app to a real server. Every lesson has commands to run, a quiz to check yourself, and the interview questions it prepares you for.",
  penNote: "free, no login",
  prerequisites: [
    ["You should know", "Basic terminal use: cd, ls, running a command. Some idea of what a web server is."],
    ["You'll need", "A laptop that can run Docker Desktop or Docker Engine, and about 10 GB of free disk."],
    ["You'll leave with", "A production-ready image, a Compose stack, a CI pipeline and a deployed app on your GitHub."],
  ],
  modules,
  project: {
    intro:
      "One app, built a step at a time as you learn. A Node API with Postgres, Redis and Nginx. Every step is a git tag in the companion repo, so you can check out any point and compare.",
    steps: projectSteps,
  },
  meta: {
    title: "Docker, from first principles",
    description:
      "Learn Docker from what a container is to shipping one to production, with quizzes, a project and an interview bank.",
  },
};

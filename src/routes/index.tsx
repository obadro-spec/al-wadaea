import { createFileRoute } from "@tanstack/react-router";
import { Advisor } from "@/components/advisor";

export const Route = createFileRoute("/")({ component: Advisor });

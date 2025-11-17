import projectsJson from "@/data/projects.json"

export type ProjectItem = {
  id: string
  title: string
  location: string
  year: string
  type: string
  description: string
  image: string
  services: string[]
}

export const projects: ProjectItem[] = projectsJson as ProjectItem[]
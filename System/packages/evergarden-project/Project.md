---
tags:
  - is/dynamic
---
# Project
```dataviewjs
const { Projects } = await cJS();

let projects = Projects.getProjects();

// Determines display order of statuses, unspecified will follow
let project_list = { active: [], backlog: [], archived: [] };

// Group project by status
for (const project of projects) {
    if (!project_list[project.state]) {
        project_list[project.state] = [];
    }
    project_list[project.state].push(project);
}

// Render grouped projects
for (const [status, projects] of Object.entries(project_list)) {
    if (!projects.length) { continue; }

    dv.header(2, status[0].toUpperCase() + status.slice(1));
    dv.container.createEl("em", {
        text: `${projects.length} projects`
    });
    projects.forEach(project => {
        dv.container.createDiv({
            text: project.link.setSourcePath(dv.current().file.path).toAnchor()
        });
    })
}
```
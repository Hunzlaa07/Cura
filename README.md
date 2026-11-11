<div align="center">

# Cura

### AI-Powered Hiring for the Modern Workforce

**Connecting talent with opportunity through intelligent matching and streamlined recruitment.**

[Explore Cura](https://cura-talent.ai/) · [Report an Issue](https://github.com/Hunzlaa07/Cura/issues) · [Contribute](#contributing)

</div>

---

## Overview

**Cura** is an AI-powered recruitment platform designed to help employers discover relevant talent and help job seekers find opportunities aligned with their skills and aspirations. The project focuses on simplifying recruitment through candidate matching, screening workflows, and data-informed hiring decisions, with a focus on the Middle East and a broader global audience.

Recruitment is often fragmented: recruiters spend time reviewing applications manually, while candidates struggle to identify roles that fit their experience. Cura aims to bring both sides into a more structured, accessible workflow.

> **Project status:** Active development. Features described below reflect the platform's public product positioning; availability and implementation details may change. See the [live website](https://cura-talent.ai/) for the current experience.

## What Cura Aims to Solve

- **High-volume screening:** Help recruitment teams prioritize candidates based on relevant qualifications.
- **Candidate–role mismatch:** Surface opportunities and applicants using skills, experience, and preferences.
- **Limited visibility:** Make application progress and recruitment performance easier to understand.
- **Disconnected hiring workflows:** Bring candidate discovery, review, and hiring steps into one experience.

## Key Capabilities

| For recruiters | For candidates |
| --- | --- |
| AI-assisted candidate matching | Personalized job matching |
| Automated screening and candidate ranking | Profile creation and management |
| Hiring analytics and reporting | Application and interview progress tracking |
| Access to a broader talent pool | Career insights and recommendations |

### AI-Assisted Matching

Cura's product vision centers on matching candidates and opportunities using relevant signals such as skills, professional experience, and stated preferences. AI-assisted results should support—not replace—human judgment.

### Streamlined Screening

Recruiters can use structured screening and ranking workflows to focus on promising applicants and reduce repetitive review work.

### Recruitment Insights

The platform emphasizes data-informed hiring decisions through analytics and visibility into recruitment activity.

### Candidate Experience

Applicants can explore opportunities aligned with their backgrounds and follow their progress through the hiring journey.

## How It Works

1. **Create a profile:** Recruiters define hiring requirements; candidates provide their skills and experience.
2. **Discover matches:** The platform helps identify relevant candidate–job connections.
3. **Review and connect:** Recruiters evaluate applicants and move forward with interviews and hiring decisions.

## Live Application

**Website:** https://cura-talent.ai/

Explore the public website for the latest product experience and available workflows.

## Repository Structure

```text
Cura/
├── Backend/       # Server-side application
├── Frontend/      # Client-side application
└── README.md      # Project documentation
```

The repository separates frontend and backend code to support independent development and maintenance.

## Getting Started

The exact runtime versions, environment variables, and commands depend on the applications in `Frontend/` and `Backend/`. Check each directory's package manifest and configuration before running the project locally.

```bash
git clone https://github.com/Hunzlaa07/Cura.git
cd Cura
```

Then inspect the setup files in both directories, install their declared dependencies, configure the required environment variables, and start the development services using the scripts defined by the project.

**Security:** Never commit API keys, credentials, or production environment files. Add a sanitized `.env.example` for contributors when configuration requirements are documented.

> Maintainer note: Add verified install commands, required runtime versions, and local service URLs here after confirming them against the source code.

## Development Priorities

These are proposed areas for ongoing improvement, not a claim that every item is already implemented:

- [ ] Document local setup and environment configuration
- [ ] Improve test coverage and CI checks
- [ ] Refine matching and screening workflows
- [ ] Expand accessibility and mobile usability
- [ ] Improve performance, security, and observability
- [ ] Publish contribution guidelines and an issue roadmap

## Responsible AI

Hiring decisions affect people's livelihoods. Cura should be developed with careful attention to fairness, privacy, and transparency. AI-generated matches and rankings should remain reviewable by humans, avoid unsupported claims about candidates, and be evaluated for potential bias. Candidate information should be handled securely and only for legitimate recruitment purposes.

## Contributing

Contributions, bug reports, and suggestions are welcome as the project evolves.

1. Open an [issue](https://github.com/Hunzlaa07/Cura/issues) to discuss a bug or proposed change.
2. Fork the repository and create a focused feature branch.
3. Make your changes and test them locally.
4. Open a pull request explaining the problem, solution, and any relevant screenshots or tests.

Please avoid including personal candidate information, secrets, or production credentials in issues and pull requests.

## Project Links

- **Live website:** https://cura-talent.ai/
- **Source code:** https://github.com/Hunzlaa07/Cura
- **Issues and feedback:** https://github.com/Hunzlaa07/Cura/issues

## License

A license has not been verified for this repository. **Before describing Cura as open source or accepting external contributions under an open-source license, add an appropriate `LICENSE` file and confirm that you have the rights to license all included code and assets.** Public source availability alone does not grant reuse rights.

---

<div align="center">

**Cura — Connecting talent with opportunity.**

</div>

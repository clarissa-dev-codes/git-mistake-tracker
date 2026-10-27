# Git Mistake Tracker

Git Mistake Tracker is a high-performance developer utility that brings granular line-level Git author history and instant bug reporting directly into your workspace. By parsing local Git blame metadata asynchronously, it highlights context details seamlessly without disrupting your coding flow.

## Core Features

* **Real-Time Status Bar Feedback:** Instantly displays the author name and the short commit summary of the active line in the bottom right corner of the window as you navigate through code files.
* **Rich Metadata Hovers:** Pausing over a committed line reveals a structured Markdown tooltip detailing the absolute author name, full commit summary, and specific commit hash.
* **Instant GitHub Issue Generation:** Injects a dynamic, secure action link directly inside the hover card. Clicking the link parses your real-world repository origin configuration (both HTTPS and SSH configurations supported) and opens a pre-filled GitHub Issue form in your default browser, tagging the author and formatting the targeted code snippet within an isolated block.

## How It Works

The extension operates with a defensive architecture to protect system performance:
1. It listens to selection adjustments via the workspace environment.
2. It queries local Git porcelain configurations asynchronously within the native file directory layout.
3. It simplifies template rendering parameters to avoid syntax interpolation failures inside nested Markdown cards.
4. It sanitizes uncommitted workspaces safely, keeping system popups hidden until code changes are actively committed.

## Extension Settings

This extension currently requires zero configuration out of the box. It will automatically activate whenever files belonging to supported languages are loaded into an active workspace initialized with a valid Git origin pointing to a GitHub host.

## Supported Languages

* JavaScript
* TypeScript
* Python

## Extension Commands

This extension contributes the following commands to the command palette and active interface layers:

* `git-mistake-tracker.openIssue`: Validates repository origin configurations and constructs native browser requests to create target issue templates dynamically.

## Installation Requirements

* Local installation of Git (accessible via your system environment PATH).
* Active workspace repositories must have an active remote origin configured pointing to a valid GitHub repository link.

## Release Notes

### 1.0.0
* Initial production release.
* Implemented background asynchronous Git blame execution loops.
* Integrated responsive Status Bar indicators and secure dynamic Hover template links.

### 1.0.1
* Fixed an issue where the hover tooltip components incorrectly displayed template interpolation placeholders instead of literal evaluation values.
* Refactored string aggregation mechanisms to prevent rendering syntax failures inside the Markdown presentation layout.
* Enhanced raw text parsing regex performance to guarantee more resilient commit summary metadata extraction on localized environments.

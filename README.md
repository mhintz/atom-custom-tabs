# custom-tabs

Allows setting a custom template for atom editor tab names. Like the `custom-title` package combined with the `rename-tabs` package.

Uses the underscore template syntax. In the invoked template, the available values are:

```
{
    path: Node's path module
    fileName: the file name
    filePath: the file's full path
    projectPath: the project path
    projectName: the project's name (path.basename(projectPath))
    repo: the Atom repo object representing the project's base git repository (atom.project.getRepositories()[0])
    gitHead: the branch of the current git HEAD (repo.getShortHead())
    devMode: whether the project is in dev mode (atom.inDevMode())
    safeMode: whether the project is in safe mode (atom.inSafeMode())
    stats: diff stats about the file (repo.getDiffStats(filePath))
    relativeFilePath: relative path to the base project (path.relative(projectPath, filePath))
    fileInProject: is the file in the current project
}
```

The default template shows the last two elements in the file path:

```
<%= filePath.split(path.sep).slice(-2).join(path.sep) %>
```

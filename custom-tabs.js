'use babel';

import path from 'path';
import _ from 'underscore';
import { allowUnsafeNewFunction } from 'loophole';
import { CompositeDisposable, TextEditor } from 'atom';

const DEFAULT_TEMPLATE =
    '<%= filePath.split(path.sep).slice(-2).join(path.sep) %>';
const DEFAULT_TEMPLATE_FUNC = constructTemplate(DEFAULT_TEMPLATE);
const TAB_SELECTOR = 'li.tab .title';

function allTabs() {
    return _.toArray(document.querySelectorAll(TAB_SELECTOR));
}

function constructTemplate(templateText) {
    return allowUnsafeNewFunction(() => {
        return _.template(templateText);
    });
}

export default {
    configDefaults: {
        template: DEFAULT_TEMPLATE
    },

    config: {
        template: {
            type: 'string',
            default: DEFAULT_TEMPLATE
        }
    },

    subscriptions: null,

    activate(state) {
        this.template = DEFAULT_TEMPLATE_FUNC;

        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(
            atom.config.observe('custom-tabs.template', () => {
                const templateString = atom.config.get('custom-tabs.template');

                if (templateString) {
                    try {
                        this.template = constructTemplate(templateString);
                    } catch (e) {
                        console.error(
                            '[custom-tabs] Error creating custom-tabs template: ',
                            e
                        );
                    }
                }
            })
        );

        // Register command that toggles this view
        this.subscriptions.add(
            atom.workspace.observeTextEditors(editor => {
                let editorSubscriptions = new CompositeDisposable();
                editorSubscriptions.add(
                    editor.onDidDestroy(() => {
                        editorSubscriptions.dispose();
                    })
                );
                editorSubscriptions.add(
                    editor.onDidChangePath(() => {
                        this.updateAllTabs();
                    })
                );
            })
        );
        this.subscriptions.add(
            atom.workspace.onDidOpen(() => {
                this.updateAllTabs();
            })
        );

        this.subscriptions.add(
            atom.workspace.observePanes(pane => {
                let paneSubscriptions = new CompositeDisposable();
                paneSubscriptions.add(
                    pane.onDidDestroy(() => {
                        paneSubscriptions.dispose();
                    })
                );
                paneSubscriptions.add(
                    pane.onDidMoveItem(() => {
                        this.updateAllTabs();
                    })
                );
                paneSubscriptions.add(
                    pane.onDidRemoveItem(arg1 => {
                        this.updateAllTabs();
                    })
                );
            })
        );
    },

    getTemplateVars(fileName, filePath) {
        let projectPath = atom.project.getPaths()[0];
        let projectName = projectPath ? path.basename(projectPath) : null;
        let repo = atom.project.getRepositories()[0];
        let gitHead = repo ? repo.getShortHead() : null;

        let devMode = atom.inDevMode();
        let safeMode = atom.inSafeMode();

        let stats = filePath && repo ? repo.getDiffStats(filePath) : null;

        let relativeFilePath, fileInProject;
        if (filePath && projectPath) {
            relativeFilePath = path.relative(projectPath, filePath);
            if (filePath.startsWith(projectPath)) {
                fileInProject = true;
            }
        }

        return {
            path,
            fileName,
            filePath,
            projectPath,
            projectName,
            repo,
            gitHead,
            devMode,
            safeMode,
            stats,
            relativeFilePath,
            fileInProject
        };
    },

    updateTabName(tabEl) {
        let name = tabEl.getAttribute('data-name');
        let path = tabEl.getAttribute('data-path');
        // Don't edit tabs that don't display files
        if (!name || !path) {
            return;
        }
        let templateVars = this.getTemplateVars(name, path);
        try {
            tabEl.textContent = this.template(templateVars);
        } catch (e) {
            console.error(
                '[custom-tabs] Error executing tab title template: ',
                e
            );
        }
    },

    updateAllTabs() {
        _.defer(() => {
            allTabs().forEach(el => {
                this.updateTabName(el);
            });
        });
    },

    deactivate() {
        this.subscriptions.dispose();
    }
};


export default function ({ types: t, template }) {

    function getModuleName (file) {
        let moduleName;

        file.comments.some(comment => {
            let r;
            if (r = comment.value.match(/setmodule:\s*(.+)/i)) {
                moduleName = r[1];

                return true;
            }
            return false;
        });

        return moduleName || file.opts.filename.split('/').pop().replace(/\.js$/, '');
    }

    function toImportDeclaration (moduleName, modules, funcBody, ns='ymaps') {
        return t.callExpression(
            t.identifier(`${ns}.modules.define`),
            [
                t.stringLiteral(moduleName),
                t.arrayExpression(modules.map(m => t.stringLiteral(m.name.replace(/\.js$/, '')))),
                funcBody
            ]
        );
    }

    function toExportObject (declList) {
        const props = [];
        declList.forEach(decl => {
            const { type } = decl;
            switch (type) {
                case 'FunctionDeclaration':
                    props.push(
                        t.objectProperty(
                            t.identifier(decl.id.name),
                            t.functionExpression(null, [], decl.body)
                        )
                    );
                    break;
                case 'VariableDeclaration':
                    decl.declarations.forEach(d => {
                        props.push(
                            t.objectProperty(
                                t.identifier(d.id.name),
                                d.init
                            )
                        );
                    });
                    break;
            }
        });

        return t.objectExpression(props);
    }

    function toExportFunction (exportDeclarations) {
        return t.expressionStatement(
                t.callExpression(
                    t.identifier('provide'),
                    [
                        Array.isArray(exportDeclarations) ? toExportObject(exportDeclarations) : exportDeclarations
                    ]
                )
            );
    }

    function wrapProgramBody ({body, importModules: modules, options}) {
        const funcBody = t.functionExpression(
            null,
            [
                t.identifier('provide'),
                ...modules.map(m => {
                    let name = m.localName.length ? m.localName : m.name.replace(/\.js$/, '');
                    return t.identifier(name);
                })
            ],
            t.blockStatement(body)
        );

        return [toImportDeclaration(options.moduleName, modules, funcBody)];
    }

    function getModuleLocalName (node) {
        return node.specifiers
            .filter(spec => spec.type === 'ImportNamespaceSpecifier')
            .map(spec => spec.local.name);
    }

    const bodyVisitor = {
        ImportDeclaration (path) {
            let { node } = path;
            this.data.importModules.push({
                name: node.source.value,
                localName: getModuleLocalName(node)
            });

            path.remove();
        },

        ExportDefaultDeclaration (path) {
            this.data.defaultExport = path.node.declaration;
            path.remove();
        },

        ExportNamedDeclaration (path) {
            this.data.exportDeclarations.push(path.node.declaration);
            path.remove();
        }
    };

    class ModuleBuilder {
        constructor (file, options) {
            this._file = file;
            this._path = file.path;
            this._options = {
                namespace: 'ym',
                moduleName: getModuleName(this._path.parent)
            };
            Object.assign(this._options, options);
        }

        _collectData () {
            const data = {
                importModules: [],
                exportDeclarations: [],
                defaultExport: null
            };
            this._path.traverse(bodyVisitor, { data });

            return data;
        }

        build () {
            let { importModules, exportDeclarations, defaultExport } = this._collectData(),
                body = [];

            this._path.node.body.push(toExportFunction(defaultExport || exportDeclarations));
            this._path.node.body = wrapProgramBody({
                importModules, exportDeclarations,
                body: this._path.node.body,
                options: this._options
            });
        }
    }

    const ProgramVisitor = {
        Program: {
            enter: function (path, { file, opts }) {
                const builder = new ModuleBuilder(file, opts);
                builder.build();
            }
        }
    };

    return {
        visitor: ProgramVisitor
    };
}

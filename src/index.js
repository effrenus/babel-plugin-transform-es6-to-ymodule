
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

	function toExportFunction (exportDeclarations) {
		return t.expressionStatement(
				t.callExpression(
					t.identifier('provide'),
					[
						t.objectExpression(exportDeclarations.map(decl => {
							const { type } = decl;
							let val;
							if (type == 'FunctionDeclaration') {
								val = t.functionExpression(null, [], decl.body);
							} else {
								val = t.stringLiteral('test');
							}

							return t.objectProperty(t.stringLiteral(decl.id.name), val);
						}))
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
		ImportDeclaration: function (path) {
			let { node } = path;
			this.importModules.push({
				name: node.source.value,
				localName: getModuleLocalName(node)
			});

			path.remove();
		},

		ExportNamedDeclaration: function (path) {
			this.exportDeclarations.push(path.node.declaration);
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
			const importModules = [],
				  exportDeclarations = [];
			this._path.traverse(bodyVisitor, { importModules, exportDeclarations });

			return { importModules, exportDeclarations };
		}

		build () {
			let { importModules, exportDeclarations } = this._collectData();
			this._path.node.body.push(toExportFunction(exportDeclarations));
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
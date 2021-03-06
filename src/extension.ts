// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as lodash from "lodash";
import { stdout } from 'process';

class InterfaceItem implements vscode.QuickPickItem {

	label: string;
	name: string;
	package: string;
	location: vscode.Location;

	constructor(public symbol: vscode.SymbolInformation) {
		this.label = symbol.name + " " + symbol.containerName;
		this.name = symbol.name;
		this.package = symbol.containerName;
		this.location = symbol.location;
	}
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "autoimpl" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('autoimpl.generateInterfaceStub', () => {
		// The code you place here will be executed every time your command is executed

		const quickPick = vscode.window.createQuickPick();

		let handle = lodash.debounce(function name(value: string) {
			console.debug("onDidChangeValue ", value);
			quickPick.busy = true;
			vscode.commands.executeCommand<vscode.SymbolInformation[]>("vscode.executeWorkspaceSymbolProvider", value).then(
				symbols => {

					if (symbols === undefined) {
						return;
					}

					quickPick.items = symbols.filter(symbol => symbol.kind === vscode.SymbolKind.Interface).map(symbol => {
						// console.log(symbol);
						return new InterfaceItem(symbol);
					});
				}
			);
			quickPick.busy = false;
		}, 300);

		quickPick.onDidChangeValue(handle);

		quickPick.onDidChangeSelection(selections => {
			console.debug("onDidChangeSelection ", selections);
			const item = selections[0];
			if (item instanceof InterfaceItem) {
				console.info(item);
				const command = "impl 'ReceiverName__ *Receiver__' " + item.package + "." + item.name;
				console.info(command);
				cp.exec(command, { cwd: vscode.workspace.workspaceFolders === undefined ? "" : vscode.workspace.workspaceFolders[0].uri.path },
					(err, out) => {
						if (err) {
							const message = command + "\n" + err.message;
							vscode.window.showErrorMessage(message);
							return;
						}
						// debounce

						const message = command;
						vscode.window.showInformationMessage(message);
						const editor = vscode.window.activeTextEditor;

						let stub = "\n" + out + "\n";
						stub = stub.replace("(ReceiverName__ * Receiver__)", "($0 *$1)");
						stub = stub.replace(new RegExp("ReceiverName__", 'g'), '${0:r}');
						stub = stub.replace(new RegExp("Receiver__", 'g'), '${1:receiver}');
						let snippet = new vscode.SnippetString(stub);
						editor?.insertSnippet(snippet);
					});
			}
		});

		quickPick.onDidAccept(object => {
			console.log("onDidAccpect ", object);
		});

		quickPick.show();
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }



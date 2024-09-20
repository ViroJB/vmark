// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface Bookmark {
	filePath: string;
	line: number;
	character: number;
}

interface BookmarkQuickPickItem extends vscode.QuickPickItem {
	index: number;  // Add the 'index' property here
}

export function activate(context: vscode.ExtensionContext) {
	let bookmarks: (Bookmark | null)[] = new Array(5);

	// Load bookmarks from workspace state
	const loadBookmarks = () => {
		const savedBookmarks = context.workspaceState.get<Bookmark[]>('bookmarks');
		if (savedBookmarks) {
			bookmarks = savedBookmarks;
		}
	};

	// Save bookmarks to workspace state
	const saveBookmarks = () => {
		context.workspaceState.update('bookmarks', bookmarks);
	};

	// Load bookmarks when the extension is activated
	loadBookmarks();

	const setBookmark = (index: number) => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const position = editor.selection.active;
			bookmarks[index] = {
				filePath: editor.document.uri.fsPath,
				line: position.line,
				character: position.character
			};
			saveBookmarks();
			vscode.window.showInformationMessage(`Bookmark ${index + 1} set`);
		}
	};

	const jumpToBookmark = async (index: number) => {
		const bookmark = bookmarks[index];
		if (bookmark) {
			try {
				// Check if the file exists
				await vscode.workspace.fs.stat(vscode.Uri.file(bookmark.filePath));

				// Open the file
				const doc = await vscode.workspace.openTextDocument(bookmark.filePath);
				const editor = await vscode.window.showTextDocument(doc);

				// Ensure the line exists
				const totalLines = doc.lineCount;
				let targetLine = bookmark.line;
				if (targetLine >= totalLines) {
					vscode.window.showWarningMessage(`Bookmark ${index + 1}: Line ${targetLine} does not exist. Jumping to last line.`);
					targetLine = totalLines - 1; // Jump to the last line if the target line does not exist
				}

				// Ensure the character position exists in the line
				const lineText = doc.lineAt(targetLine).text;
				let targetCharacter = bookmark.character;
				if (targetCharacter > lineText.length) {
					vscode.window.showWarningMessage(`Bookmark ${index + 1}: Character position ${targetCharacter} exceeds line length. Jumping to end of line.`);
					targetCharacter = lineText.length; // Adjust to the last character in the line if too large
				}

				// Jump to the valid position
				const position = new vscode.Position(targetLine, targetCharacter);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position));

			} catch (error) {
				// If the file does not exist or other errors occur
				vscode.window.showErrorMessage(`Bookmark ${index + 1}: File "${bookmark.filePath}" does not exist or cannot be opened.`);
			}
		} else {
			vscode.window.showInformationMessage(`Bookmark ${index + 1} not set`);
		}
	};

	const listBookmarks = () => {
		const options = bookmarks
			.map((bookmark, index) => {
				if (bookmark) {
					return {
						label: `Bookmark ${index + 1}`,
						description: `${bookmark.filePath}:${bookmark.line + 1}:${bookmark.character + 1}`, // Display line and character (1-based indexing)
						bookmarkIndex: index
					};
				}
				return null;
			})
			.filter(option => option !== null); // Remove null entries if any bookmarks are not set

		if (options.length === 0) {
			vscode.window.showInformationMessage('No bookmarks set.');
			return;
		}

		// Show dropdown menu with bookmark options
		vscode.window.showQuickPick(options, {
			placeHolder: 'Select a bookmark to jump to'
		}).then(selected => {
			if (selected) {
				jumpToBookmark(selected.bookmarkIndex);
			}
		});
	};

	const deleteBookmark = (index: number) => {
		bookmarks[index] = null; // Remove the bookmark
		saveBookmarks(); // Save the updated bookmark list
	};

	const registerCommand = (command: string, callback: (...args: any[]) => any) => {
		let disposable = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disposable);
	};

	registerCommand('vmark.listBookmarks', () => listBookmarks());

	// Register commands for setting bookmarks
	registerCommand('vmark.setBookmark1', () => setBookmark(0));
	registerCommand('vmark.setBookmark2', () => setBookmark(1));
	registerCommand('vmark.setBookmark3', () => setBookmark(2));
	registerCommand('vmark.setBookmark4', () => setBookmark(3));
	registerCommand('vmark.setBookmark5', () => setBookmark(4));

	// Register commands for jumping to bookmarks
	registerCommand('vmark.jumpToBookmark1', () => jumpToBookmark(0));
	registerCommand('vmark.jumpToBookmark2', () => jumpToBookmark(1));
	registerCommand('vmark.jumpToBookmark3', () => jumpToBookmark(2));
	registerCommand('vmark.jumpToBookmark4', () => jumpToBookmark(3));
	registerCommand('vmark.jumpToBookmark5', () => jumpToBookmark(4));
}

// This method is called when your extension is deactivated
export function deactivate() { }

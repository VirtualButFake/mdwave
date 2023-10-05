export default {
	createTokens(typeContext, type, depthOffset) {
		const isPunc = (char) => !!char.match(/[\{\}\[\]<>\-\|]/);
		const isWhitespace = (char) => !!char.match(/\s/);
		const isAtom = (char) => !isWhitespace(char) && !isPunc(char);

		function tokenize(code, isGroup) {
			let position = 0;

			const next = () => code[position++];
			const peek = () => code[position];

			const read = (condition) => {
				let buffer = "";

				while (peek() && condition(peek())) {
					buffer += next();
				}

				return buffer;
			};

			const readBalanced = (left, right) => {
				let buffer = "";

				let depth = 0;
				while (peek()) {
					if (peek() === left) {
						depth++;
					} else if (peek() === right) {
						if (depth === 0) {
							break;
						} else {
							depth--;
						}
					}

					buffer += next();
				}

				return buffer;
			};

			const tokens = [];

			while (position < code.length) {
				read(isWhitespace);

				if (position >= code.length) {
					break;
				}

				if (peek() === "(") {
					next();
					tokens.push({
						type: "tuple",
						unseparatedTokens: tokenize(
							readBalanced("(", ")"),
							true,
						),
					});
					next();
					continue;
				}

				if (peek() === "[") {
					next();
					tokens.push({
						type: "indexer",
						tokens: tokenize(readBalanced("[", "]")),
					});
					next();
					continue;
				}

				if (peek() === "{") {
					next();
					tokens.push({
						type: "table",
						unseparatedTokens: tokenize(
							readBalanced("{", "}"),
							true,
						),
					});
					next();
					continue;
				}

				if (isGroup && peek() === ",") {
					next();
					tokens.push({
						type: "separator",
					});
					continue;
				}

				if (isPunc(peek())) {
					const punc = next();

					if (punc === "-" && peek() === ">") {
						tokens.push({
							type: "arrow",
						});
						next();
						continue;
					}

					if (punc === "|") {
						tokens.push({ type: "union" });
						continue;
					}

					tokens.push({
						type: "punc",
						punc,
					});
					continue;
				}

				const atom = read((char) =>
					isGroup ? char !== "," && isAtom(char) : isAtom(char),
				);

				if (atom) {
					if (atom.endsWith(":")) {
						tokens.push({
							type: "identifier",
							identifier: atom.slice(0, -1),
						});
					} else {
						tokens.push({
							type: "luaType",
							luaType: atom,
						});
					}
					continue;
				}

				throw new Error(
					`Reached bottom of tokenizer with no match: ${peek()}`,
				);
			}

			return tokens.map(separateGroups);
		}

		function separateGroups(token) {
			if (!token.unseparatedTokens) {
				return token;
			}

			const separatedTokens = [[]];

			token.unseparatedTokens.forEach((token) => {
				if (token.type === "separator") {
					separatedTokens.push([]);
				} else {
					token = separateGroups(token);

					separatedTokens[separatedTokens.length - 1].push(token);
				}
			});

			return {
				...token,
				separatedTokens,
			};
		}

		const tokens = tokenize(type);

		// map tokens
		// by "map", i mean create a massive object that contains all tokens with color, depth, line, type & string
		// color is optional; will be taken from depth otherwise

		// wrap top token in root token
		const initialTokenType = {
			type: "root",
			tokens,
		};
		let tokenMap = [];
		let currentLine = -1;

		function advanceLine(depth) {
			tokenMap[currentLine + 1] = {
				tokens: [],
				depth: depth,
			};

			currentLine += 1;
		}

		advanceLine(depthOffset || 0);

		function addToken(token) {
			tokenMap[currentLine].tokens.push(token);
		}

		function processToken(token, depth) {
			switch (token.type) {
				case "root":
					// process all children tokens
					for (const childToken of token.tokens) {
						processToken(childToken, 0);
					}
					break;
				case "tuple":
					// process all children tokens BUT add parenthesis
					const newDepth = depth + 1;
					let lineDepth = newDepth;
					let isSpecialCase = false;

					if (
						(token.separatedTokens[0] &&
							token.separatedTokens[0][0]?.type == "table") ||
						token.separatedTokens.length == 1
					) {
						lineDepth -= 1;
						isSpecialCase = true;
					}

					addToken({
						type: "code",
						text: "(",
						depth: newDepth,
					});

					for (const childTokens of token.separatedTokens) {
						if (!isSpecialCase) {
							advanceLine(lineDepth);
						}
						for (const childToken of childTokens) {
							processToken(childToken, lineDepth);
						}

						if (
							childTokens !=
							token.separatedTokens[
								token.separatedTokens.length - 1
							]
						) {
							addToken({
								type: "code",
								text: ", ",
								color: "text-syntax-punc-light dark:text-syntax-punc-dark",
							});
						}
					}

					if (!isSpecialCase) {
						advanceLine(depth);
					}

					addToken({
						type: "code",
						text: ")",
						depth: newDepth,
					});

					break;
				case "table":
					if (
						token.separatedTokens.length === 0 ||
						(token.separatedTokens[0].length === 0 &&
							token.separatedTokens.length === 1)
					) {
						addToken({
							type: "code",
							text: "{",
							depth: depth + 1,
						});

						addToken({
							type: "code",
							text: "}",
							depth: depth + 1,
						});

						break;
					}

					let lnDepth = depth + 1;
					let specialCase = false;

					if (
						(token.separatedTokens[0] &&
							token.separatedTokens[0][0]?.type == "table") ||
						token.separatedTokens.length == 1
					) {
						lnDepth -= 1;
						specialCase = true;
					}

					addToken({
						type: "code",
						text: "{",
						depth: depth + 1,
					});

					for (const childTokens of token.separatedTokens) {
						if (!specialCase) {
							advanceLine(depth + 1);
						}
						for (const childToken of childTokens) {
							processToken(childToken, lnDepth);
						}

						if (
							childTokens !=
							token.separatedTokens[
								token.separatedTokens.length - 1
							]
						) {
							addToken({
								type: "code",
								text: ",",
								color: "text-syntax-punc-light dark:text-syntax-punc-dark",
							});
						}
					}

					if (!specialCase) {
						advanceLine(depth);
					}

					addToken({
						type: "code",
						text: "}",
						depth: depth + 1,
					});

					break;
				case "identifier":
					addToken({
						type: "code",
						text: token.identifier,
						color: "text-syntax-identifier-light dark:text-syntax-identifier-dark",
					});

					addToken({
						type: "code",
						text: ": ",
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});

					break;
				case "arrow":
					addToken({
						type: "code",
						text: " → ",
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});

					break;
				case "punc":
					addToken({
						type: "code",
						text: token.punc,
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});

					break;
				case "union":
					addToken({
						type: "op",
						text: " | ",
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});

					break;
				case "indexer":
					addToken({
						type: "code",
						text: "[",
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});

					for (const childToken of token.tokens) {
						processToken(childToken, depth + 1);
					}

					addToken({
						type: "code",
						text: "]",
						color: "text-syntax-punc-light dark:text-syntax-punc-dark",
					});
					break;
				case "luaType":
					const sanitizedToken = token.luaType.replace(/\W/g, "");
					if (sanitizedToken in typeContext) {
						addToken({
							type: "link",
							text: token.luaType,
							href: typeContext[sanitizedToken],
						});

						break;
					}

					if (!Number(token.luaType)) {
						if (token.luaType == ",") {
							//weird bug
							addToken({
								type: "code",
								text: token.luaType,
								color: "text-syntax-punc-light dark:text-syntax-punc-dark",
							});
							break;
						}

						addToken({
							type: "code",
							text: token.luaType,
							color: "text-syntax-default-light dark:text-syntax-default-dark",
						});
					} else {
						addToken({
							type: "code",
							text: token.luaType,
							color: "text-syntax-number-light dark:text-syntax-number-dark",
						});
					}

					break;
				default:
			}
		}

		for (const token of initialTokenType.tokens) {
			processToken(token, depthOffset || 0);
		}

		return tokenMap;
	},
	mergeTokens(a, b, addFirstOnSameLine) {
		// adds b to a
		a = a.slice(0);
		b = b.slice(0);

		let startIndex = a.length;
		let addedFirst = false;
		let startIndexOffset = 0;

		for (let i = 0; i < b.length; i++) {
			if (!addedFirst) {
				// paste all elements on our current line into a's last line
				if (addFirstOnSameLine) {
					a[a.length - 1].tokens = a[a.length - 1].tokens.concat(
						b[i].tokens,
					);
					addedFirst = true;
					startIndexOffset = 1;
					continue;
				}
			}

			a[startIndex + i - startIndexOffset] = b[i];
		}

		return a;
	},
};

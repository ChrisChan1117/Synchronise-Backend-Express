"use strict"; // Activate strict mode (undeclared variables will )

var DatabaseFunctions;

dependenciesLoader(["$", "_", "React", "ReactDOM", "Loader", "Promise", "Synchronise", "ModalErrorParse", "KeyEventController", "Mousetrap"], function () {
	DatabaseFunctions = function () {
		/////////// REACT CLASSES //////////

		// Container of all the schema process
		// Props:
		// - [string]idDatabase
		// - [string]title
		// - [string]cancelButton
		// - [string]confirmButton
		// - [function]resolve
		var SchemaUpdatePopup = React.createClass({
			getInitialState: function () {
				return {
					defaultClassName: "container-fluid",
					className: "container-fluid",
					schema: {
						schema: Array(),
						actions: Array()
					},
					defaultSchema: {
						schema: Array(),
						actions: Array()
					},
					schemaChangeHistory: Array(),
					positionInHistory: 0,
					loading: true,
					saving: true,
					queryObject: false,
					styleForContent: {
						maxHeight: "0px"
					},
					styleForContainer: {
						marginTop: "0px"
					}
				};
			},
			updateDimensions: function () {
				var domElement = $(ReactDOM.findDOMNode(this));
				var totalHeight = domElement.height();
				var marginTop = "0px";

				var height = domElement.height();
				height -= domElement.find('#contentSIO').position().top;
				height -= 46; // Footer

				if (parseInt(domElement.position().top) < 65) {
					marginTop = "30px";
				}

				this.setState({
					styleForContainer: {
						marginTop: marginTop
					},
					styleForContent: {
						maxHeight: height
					}
				});
			},
			componentWillUnmount: function () {
				$(window).off('resize.SchemaUpdatePopup');
			},
			componentDidMount: function () {
				var target = this;

				window.setTimeout(function () {
					target.updateDimensions();
				}, 200);

				$(window).on('resize.SchemaUpdatePopup', target.updateDimensions);

				var query = Synchronise.Cloud.run("getDatabaseSchemaUpdates", { idDatabase: this.props.idDatabase, realtime: true }, {
					success: function (databaseStructure) {
						if (databaseStructure.status == "noUpdate") {
							target.cancel();
						} else {

							var schema = {
								schema: _.map(databaseStructure.updatedSchema, function (table) {
									return table;
								}),
								actions: Array()
							};

							var schemaChangeHistory = target.state.schemaChangeHistory;
							schemaChangeHistory.push(schema);

							target.setState({
								schema: schema,
								defaultSchema: schema,
								schemaChangeHistory: schemaChangeHistory
							});
						}

						var siotarget = this;
					},
					error: function (error) {
						new ModalErrorParse(error);
					},
					abort: function () {
						target.cancel();
					},
					always: function () {
						target.setState({ loading: false });
					}
				});

				KeyEventController.subscribeComponent("SchemaUpdatePopup", function (key) {
					if (key == 27) {
						target.cancel();
						query.abort();
					}
				});

				Mousetrap.bind('mod+z', function (e) {
					target.undo();
				});

				Mousetrap.bind('mod+shift+z', function (e) {
					target.redo();
				});

				this.setState({
					className: this.state.defaultClassName + ' fadeInBigBackground',
					loading: true,
					queryObject: query
				});
			},
			componentWillUnmount: function () {
				if (typeof this.state.queryObject != "undefined") {
					this.state.queryObject.setRealtime(false);
				}

				Mousetrap.unbind('mod+z');
			},
			cancel: function () {
				var target = this;
				this.setState({ className: this.state.defaultClassName + ' fadeOutBigBackground' });

				KeyEventController.unsubscribeComponent("SchemaUpdatePopup");

				window.setTimeout(function () {
					target.props.resolve();
					ReactDOM.unmountComponentAtNode(document.getElementById('databaseSchemaUpdatePopupContainer'));
				}, 300);
			},
			confirm: function () {
				var target = this;

				var schemaToUse = {};
				var actions = Array();
				var historyLength = this.state.schemaChangeHistory.length;

				if (historyLength) {
					schemaToUse = this.state.schemaChangeHistory[historyLength - 1];
					actions = schemaToUse.actions;
				} else {
					schemaToUse = this.state.schema;
				}

				Synchronise.Cloud.run("updateSchema", { schema: this.state.schema, actions: actions }, {});

				this.props.resolve();
			},
			renameField: function (tableName, oldNameField, newNameField) {
				var schema = JSON.parse(JSON.stringify(this.state.schema));

				var schemaChangeHistory = this.state.schemaChangeHistory;
				if (schemaChangeHistory.length - 1 > this.state.positionInHistory) {
					schemaChangeHistory = schemaChangeHistory.slice(0, this.state.positionInHistory);
				}
				schemaChangeHistory.push(schema);

				// Save current state of the schema in the history
				this.setState({
					schemaChangeHistory: schemaChangeHistory
				});

				var currentSchema = schema.schema;

				// Find the concerned table
				var indexTable = 0;
				var table = _.find(currentSchema, function (table, index) {
					if (table.title == tableName) {
						indexTable = index;
					}

					return table.title == tableName;
				});

				// Find the indexes of the fields
				var indexToRemove = 0;
				var indexToSetAsNormal = 0;
				_.each(table.fields, function (field, index) {
					if (field.name == oldNameField) {
						indexToRemove = index;
					} else if (field.name == newNameField) {
						indexToSetAsNormal = index;
					}
				});

				table.fields.splice(indexToRemove, 1);
				table.fields[indexToSetAsNormal].status = "normal";

				currentSchema[indexTable] = table;
				schema.schema = currentSchema;
				schema.actions.push({
					type: "rename",
					element: "field",
					parent: table.title,
					from: oldNameField,
					to: newNameField
				});

				this.setState({
					schema: schema, // Change the schema to the new version
					schemaChangeHistory: schemaChangeHistory, // Save the history of changes
					positionInHistory: this.state.positionInHistory + 1 // Go to next state in history
				});
			},
			renameTable: function (oldNameTable, newNameTable) {},
			undo: function () {
				if (this.state.schemaChangeHistory.length && this.state.positionInHistory > 0) {
					this.setState({
						schema: this.state.schemaChangeHistory[this.state.positionInHistory - 1],
						positionInHistory: this.state.positionInHistory - 1
					});
				}
			},
			redo: function () {
				if (this.state.positionInHistory < this.state.schemaChangeHistory.length - 1 && this.state.schemaChangeHistory.length) {
					this.setState({
						schema: this.state.schemaChangeHistory[this.state.positionInHistory + 1],
						positionInHistory: this.state.positionInHistory + 1
					});
				}
			},
			render: function () {
				var loader = "";
				var footer = "";
				var undoRedoButtons = "";
				var target = this;

				if (this.state.loading) {
					loader = React.createElement(
						"div",
						{ className: "row-fluid", style: { textAlign: "center" } },
						React.createElement(Loader, null)
					);
				} else {
					var undoStatus = "disabled";
					var redoStatus = "disabled";

					if (this.state.schemaChangeHistory.length && this.state.positionInHistory > 0) {
						undoStatus = "";
					}

					if (this.state.positionInHistory < this.state.schemaChangeHistory.length - 1 && this.state.schemaChangeHistory.length) {
						redoStatus = "";
					}

					undoRedoButtons = React.createElement(
						"div",
						{ className: "btn-group", style: { position: "absolute", left: "10px" } },
						React.createElement(
							"button",
							{ className: "btn btn-default btn-sm " + undoStatus, onClick: this.undo },
							React.createElement("i", { className: "fa fa-undo" })
						),
						React.createElement(
							"button",
							{ className: "btn btn-default btn-sm " + redoStatus, onClick: this.redo },
							React.createElement("i", { className: "fa fa-repeat" })
						)
					);

					footer = React.createElement(
						"div",
						{ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 footer" },
						React.createElement(
							"div",
							{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6", align: "center" },
							React.createElement(
								"button",
								{ className: "btn btn-default", onClick: this.cancel },
								this.props.cancelButton
							)
						),
						React.createElement(
							"div",
							{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6", align: "center" },
							React.createElement(
								"button",
								{ className: "btn btn-primary", onClick: this.confirm },
								this.props.confirmButton
							)
						)
					);
				}

				return React.createElement(
					"div",
					{ id: "databaseSchemaUpdatePopup", className: this.state.className, style: this.state.styleForContainer },
					React.createElement("div", { id: "databaseSchemaUpdateSubpopup" }),
					React.createElement(
						"div",
						{ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 title", align: "center" },
						undoRedoButtons,
						React.createElement(
							"h4",
							null,
							this.props.title
						)
					),
					loader,
					React.createElement(
						"div",
						{ className: "row-fluid" },
						React.createElement(
							"div",
							{ className: "col-xs-12", id: "contentSIO", style: this.state.styleForContent },
							this.state.schema.schema.map(function (item) {
								return React.createElement(TableItem, { status: item.status,
									title: item.title,
									fields: item.fields,
									schema: target.state.schema.schema,
									renameTable: target.renameTable,
									renameField: target.renameField,
									key: "table" + item.title });
							})
						)
					),
					footer
				);
			}
		});

		// Display a blue progress block on top of the schema popup
		// Methods :
		// - setProgress([number]0-100) : set a progress from 0% to 100%
		// - complete : set to 100%
		// - reset : set to 0%
		var ProgressUpdate = React.createClass({
			getInitialState: function () {
				return { progress: 0, styleToApply: {} };
			},
			setStyle: function (style) {
				this.setState({ styleToApply: style });
			},
			setProgress: function (progress) {
				this.setState({ progress: progress });
				var newWidth = this.state.totalsize * this.state.progress;

				$(ReactDOM.findDOMNode(this)).animate({
					width: newWidth
				}, 300, function () {
					var currentStyle = this.state.styleToApply;
					currentStyle.width = newWidth + "px";
					this.setState({ styleToApply: currentStyle });
				});
			},
			complete: function () {
				// Set progress has complete
				this.setProgress(1);
			},
			reset: function () {
				// Set progress to beginning
				this.setProgress(0);
			},
			render: function () {
				return React.createElement("div", { className: "progressUpdate", style: this.state.styleToApply });
			}
		});

		// Display data to modify a table or collection settings
		// Props :
		// - popupTitle
		// - titleBlockLeft
		// - elementTitleBlockLeft
		// - titleBlockRight
		// - blockRightElements
		var SchemaUpdateSubpopup = React.createClass({
			getInitialState: function () {
				return {
					defaultClassName: "renamePopup",
					className: "renamePopup",
					selectedValue: ""
				};
			},
			componentDidMount: function () {
				var target = this;
				target.setState({
					className: this.state.defaultClassName + ' fadeInBigBackground',
					selectedValue: this.props.blockRightElements[0].value
				});

				var timeout = window.setTimeout(function () {
					var domElement = $(ReactDOM.findDOMNode(this));
					domElement.find('.ThirdSide ul').animate({
						opacity: 1
					}, 300);
					window.clearTimeout(timeout);
				}, 200);

				KeyEventController.subscribeComponent("SchemaUpdateSubPopup", function (key) {
					if (key == 27) {
						target.cancel();
					}
				});

				window.setTimeout(function () {
					target.updateDimensions();
				}, 200);

				$(window).on('resize.SchemaUpdateSubPopup', this.updateDimensions);
			},
			componentWillUnmount: function () {
				$(window).off('resize.SchemaUpdateSubPopup');
			},
			updateDimensions: function () {
				var target = this;

				var domElement = $(ReactDOM.findDOMNode(this));
				var totalHeight = domElement.height();

				var height = totalHeight;
				height -= domElement.find('.ThirdSide ul').position().top;
				height -= totalHeight - domElement.find('.footer').position().top;
				height -= parseInt(domElement.find('.ThirdSide ul').css('top'));

				domElement.find('.ThirdSide ul').css('height', height + 'px');
			},
			itemSelected: function (item) {
				this.setState({ selectedValue: item });
			},
			cancel: function () {
				this.hide();
				if (typeof this.props.callback != "undefined") {
					if (typeof this.props.callback.abort != "undefined") {
						this.props.callback.abort();
					}
				}
			},
			confirm: function () {
				this.hide();
				if (typeof this.props.callback != "undefined") {
					if (typeof this.props.callback.resolve != "undefined") {
						this.props.callback.resolve(this.state.selectedValue);
					}
				}
			},
			hide: function () {
				var target = this;
				target.setState({
					className: this.state.className + ' fadeOutBigBackground'
				});

				var timeout = window.setTimeout(function () {
					KeyEventController.unsubscribeComponent("SchemaUpdateSubPopup");
					window.clearTimeout(timeout);
					ReactDOM.unmountComponentAtNode(document.getElementById('databaseSchemaUpdateSubpopup'));
				}, 500);
			},
			render: function () {
				var target = this;

				return React.createElement(
					"div",
					{ className: this.state.className },
					React.createElement(
						"div",
						{ className: "row-fluid" },
						React.createElement(
							"div",
							{ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 title", align: "center" },
							React.createElement(
								"p",
								null,
								this.props.popupTitle
							)
						),
						React.createElement(
							"div",
							{ className: "content" },
							React.createElement(
								"div",
								{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 SIOSide" },
								React.createElement(
									"legend",
									{ className: "col-xs-12" },
									this.props.titleBlockLeft
								),
								React.createElement(
									"div",
									{ className: "col-xs-12" },
									React.createElement(
										"div",
										{ className: "panel panel-default" },
										React.createElement(
											"div",
											{ className: "panel-heading" },
											React.createElement(
												"h3",
												{ className: "panel-title" },
												this.props.elementTitleBlockLeft
											)
										)
									)
								)
							),
							React.createElement(
								"div",
								{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 ThirdSide" },
								React.createElement(
									"legend",
									{ className: "col-xs-12" },
									this.props.titleBlockRight
								),
								React.createElement(
									"ul",
									{ className: "list-unstyled" },
									this.props.blockRightElements.map(function (item, index) {
										return React.createElement(SchemaUpdateSubpopupItem, { value: item.value,
											title: item.title,
											selectedValue: target.state.selectedValue,
											controller: target.itemSelected,
											key: "SchemaUpdateSubpopup" + item.value });
									})
								)
							)
						),
						React.createElement(
							"div",
							{ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 footer" },
							React.createElement(
								"div",
								{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6", align: "center" },
								React.createElement(
									"button",
									{ className: "btn btn-default cancel", onClick: this.cancel },
									"Cancel"
								)
							),
							React.createElement(
								"div",
								{ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6", align: "center" },
								React.createElement(
									"button",
									{ className: "btn btn-primary rename", onClick: this.confirm },
									"Rename"
								)
							)
						)
					)
				);
			}
		});

		// Displays an item of the subpopup
		// Props :
		// - value
		// - title
		var SchemaUpdateSubpopupItem = React.createClass({
			onClickRadio: function (e) {
				this.props.controller(e.currentTarget.value);
			},
			render: function () {
				var checked = "";
				if (this.props.selectedValue == this.props.value) {
					checked = "checked";
				}

				return React.createElement(
					"li",
					null,
					React.createElement(
						"div",
						{ className: "radio" },
						React.createElement(
							"label",
							null,
							React.createElement("input", { type: "radio",
								name: "thirdSideRenameRadio",
								checked: checked,
								onChange: this.onClickRadio,
								value: this.props.value }),
							this.props.title
						)
					)
				);
			}
		});

		// Displays one table that has been updated
		// Props :
		// - status : (normal, add, remove)
		// - title
		// - fields
		var TableItem = React.createClass({
			getInitialState: function () {
				return {
					defaultStyle: "col-lg-3 col-md-4 col-sm-6 col-xs-12 tableDB",
					customStyle: "hidden",
					status: this.props.status
				};
			},
			componentDidMount: function () {
				this.setState({
					customStyle: "fadeInBigBackground"
				});
			},
			renameTable: function () {
				var target = this;
				if (this.state.status == "remove") {
					var tablesAvailable = _.map(_.filter(this.props.schema, function (table) {
						return table.status == "add";
					}), function (table) {
						return {
							value: table.title,
							title: table.title
						};
					});

					ReactDOM.render(React.createElement(SchemaUpdateSubpopup, { popupTitle: "Click on the element on the table that corresponds to the new name of the table on the left",
						titleBlockLeft: "Table saved on Synchronise",
						elementTitleBlockLeft: target.props.title,
						titleBlockRight: "Available tables on the database",
						callback: {
							resolve: function (newTableName) {
								target.props.renameTable(target.props.title, newTableName);
							}
						},
						blockRightElements: tablesAvailable }), document.getElementById('databaseSchemaUpdateSubpopup'));
				}
			},
			render: function () {
				var target = this;
				var renameTableBlock = "";
				if (this.state.status == "remove") {
					renameTableBlock = React.createElement(
						"a",
						{ href: "#", onClick: this.renameTable },
						"Has this table been renamed ?"
					);
				}

				return React.createElement(
					"div",
					{ className: this.state.defaultStyle + " " + this.state.status + " " + this.state.customStyle },
					React.createElement(
						"div",
						{ className: "panel panel-default" },
						React.createElement(
							"div",
							{ className: "panel-heading" },
							React.createElement(
								"h3",
								{ className: "panel-title" },
								this.props.title
							)
						),
						React.createElement(
							"div",
							{ className: "panel-body" },
							React.createElement(
								"ul",
								{ className: "list-unstyled" },
								this.props.fields.map(function (item) {
									return React.createElement(TableItemField, { name: item.name,
										status: item.status,
										tableStatus: target.state.status,
										schema: target.props.schema,
										nameTable: target.props.title,
										renameField: target.props.renameField,
										key: target.props.title + "." + item.name });
								})
							),
							renameTableBlock
						)
					)
				);
			}
		});

		// Displays one field of a table that is being updated
		// Props :
		// - tableStatus : (normal, add, remove)
		// - status : (normal, add, remove)
		// - name
		var TableItemField = React.createClass({
			renameField: function () {
				var target = this;

				var tablesAvailable = _.map(_.filter(_.filter(target.props.schema, function (table) {
					return table.title == target.props.nameTable;
				})[0].fields, function (field) {
					return field.status == "add";
				}), function (field) {
					return {
						value: field.name,
						title: field.name
					};
				});

				ReactDOM.render(React.createElement(SchemaUpdateSubpopup, { popupTitle: "Click on the field on the right that corresponds to the new name of the field on the left",
					titleBlockLeft: "Fields saved on Synchronise",
					elementTitleBlockLeft: this.props.name,
					titleBlockRight: "Available elements on the database",
					callback: {
						resolve: function (newFieldName) {
							target.props.renameField(target.props.nameTable, target.props.name, newFieldName);
						}
					},
					blockRightElements: tablesAvailable }), document.getElementById('databaseSchemaUpdateSubpopup'));
			},
			render: function () {
				var renameBlock = "";
				if (this.props.tableStatus == "normal" && this.props.status == "remove") {
					renameBlock = React.createElement(
						"span",
						null,
						React.createElement(
							"span",
							null,
							"\xA0"
						),
						React.createElement(
							"a",
							{ href: "#", onClick: this.renameField, style: { float: "right" } },
							"renamed?"
						)
					);
				}

				var sign = "";
				if (this.props.status == "add") {
					sign = React.createElement(
						"span",
						null,
						React.createElement(
							"span",
							{ style: { color: "green" } },
							"+"
						),
						React.createElement(
							"span",
							null,
							"\xA0"
						)
					);
				}

				if (this.props.status == "remove") {
					sign = React.createElement(
						"span",
						null,
						React.createElement(
							"span",
							{ style: { color: "red" } },
							"-"
						),
						React.createElement(
							"span",
							null,
							"\xA0"
						)
					);
				}

				return React.createElement(
					"li",
					{ className: this.props.status },
					sign,
					this.props.name,
					renameBlock
				);
			}
		});

		////////// DECLARE FUNCTIONS OF THE CLASS //////////
		return {
			updateDatabase: function (idDatabase) {
				return new Promise(function (resolve, reject) {
					var dataForReact = {
						title: "Database Schema Update",
						cancelButton: "Cancel",
						confirmButton: "Save schema",
						idDatabase: idDatabase,
						resolve: resolve,
						reject: reject
					};

					ReactDOM.render(React.createElement(SchemaUpdatePopup, dataForReact), document.getElementById('databaseSchemaUpdatePopupContainer'));
				});
			},
			databaseSchema: function (idDatabase) {
				return new Promise(function (resolve, reject) {
					resolve();
				});
			}
		};
	}();
});
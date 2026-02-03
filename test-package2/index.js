// Simple UI Table Component
module.exports = function Table(props) {
	return `<table class="${props.className || ""}">${props.children || "<tr><td>Table</td></tr>"}</table>`
}

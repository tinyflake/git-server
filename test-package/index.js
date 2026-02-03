// Simple UI Button Component
module.exports = function Button(props) {
	return `<button class="${props.className || ""}">${props.children || "Button"}</button>`
}

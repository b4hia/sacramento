export const SUIT_DECIMALS = {
	spades: 0.4,
	hearts: 0.3,
	diamonds: 0.2,
	clubs: 0.1
};

export function getCardNumericValue(card = {}) {
	let value = Number(card.value) || 0;
	const face = (card.faces && card.faces.length > 0 ? card.faces[0].name : card.name || "").toLowerCase();

	if (face.includes("ace")) value = 14;
	else if (face.includes("king")) value = 13;
	else if (face.includes("queen")) value = 12;
	else if (face.includes("jack")) value = 11;
	else if (value === 1) value = 14;

	return value;
}

export function getCardSuit(card = {}) {
	if (card.suit) return card.suit.toLowerCase();

	const name = (card.name || "").toLowerCase();
	if (name.includes("spades")) return "spades";
	if (name.includes("hearts")) return "hearts";
	if (name.includes("diamonds")) return "diamonds";
	if (name.includes("clubs")) return "clubs";
	return "";
}

export function calculateCardInitiative(card = {}) {
	const value = getCardNumericValue(card);
	const suit = getCardSuit(card);
	const suitDecimal = SUIT_DECIMALS[suit] || 0.0;
	return Number((value + suitDecimal).toFixed(1));
}

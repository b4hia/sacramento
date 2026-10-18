export function calculateNpcStats(cr = 1, isSpecial = false) {
	const normalizedCr = Math.max(1, Number(cr) || 1);
	return {
		maxHealth: isSpecial ? normalizedCr * 6 : normalizedCr * 3,
		maxPain: 6,
		defense: 5,
		actions: isSpecial ? normalizedCr + 3 : normalizedCr + 1
	};
}

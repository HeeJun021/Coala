export const colorPalette = [
  "#8da4f1", "#a5c5e8", "#a9d3c5", "#d9b4a3", "#d3cbc2",
  "#d5c5c5", "#b9e2cc", "#e9c78a", "#b0b0e8", "#e3b9cb",
  "#b8dee8", "#f0c9a6", "#c9e0b4", "#dab8e0", "#b8e8d4",
];

export const getRandomColor = () => {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
};

export const getTextColor = (bgColor) => {
  const c = bgColor.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#000000" : "#ffffff";
};
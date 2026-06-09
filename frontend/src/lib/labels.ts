export function difficultyLabel(value: 'easy' | 'moderate' | 'hard') {
  if (value === 'easy') return 'Легкий';
  if (value === 'moderate') return 'Середній';
  return 'Складний';
}

export function routeTypeLabel(value: 'loop' | 'out-and-back' | 'point-to-point') {
  if (value === 'loop') return 'Кільцевий';
  if (value === 'out-and-back') return 'Туди й назад';
  return 'Лінійний';
}

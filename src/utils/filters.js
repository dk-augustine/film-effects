export const FILM_FILTERS = [
  {
    id: 'normal',
    name: 'Normal',
    settings: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      hueRotate: 0
    }
  },
  {
    id: 'kodak-portra',
    name: 'Kodak Portra',
    settings: {
      brightness: 105,
      contrast: 95,
      saturation: 110,
      sepia: 15,
      hueRotate: -5
    }
  },
  {
    id: 'fuji-superia',
    name: 'Fuji Superia',
    settings: {
      brightness: 100,
      contrast: 110,
      saturation: 120,
      sepia: 0,
      hueRotate: 10 // push towards green/cyan
    }
  },
  {
    id: 'leica-monochrom',
    name: 'Leica B&W',
    settings: {
      brightness: 110,
      contrast: 130,
      saturation: 0,
      sepia: 0,
      hueRotate: 0
    }
  },
  {
    id: 'vintage-warm',
    name: 'Warm Vintage',
    settings: {
      brightness: 90,
      contrast: 85,
      saturation: 80,
      sepia: 40,
      hueRotate: -10
    }
  }
];

export const applyFilterToContext = (ctx, baseAdjustments, filterId) => {
  const filter = FILM_FILTERS.find(f => f.id === filterId) || FILM_FILTERS[0];
  const s = filter.settings;
  
  // Combine base adjustments with filter settings
  const b = (baseAdjustments.brightness / 100) * (s.brightness / 100) * 100;
  const c = (baseAdjustments.contrast / 100) * (s.contrast / 100) * 100;
  const sat = (baseAdjustments.saturation / 100) * (s.saturation / 100) * 100;
  
  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${sat}%) sepia(${s.sepia}%) hue-rotate(${s.hueRotate}deg)`;
};

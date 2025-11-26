export default {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        'defaults',
        'last 2 versions',
        '> 1%',
        'iOS >= 12',
        'Safari >= 12',
        'Chrome >= 80',
        'Firefox >= 78',
        'Edge >= 88',
        'not dead'
      ],
      // Garantir vendor prefixes para backdrop-filter
      flexbox: 'no-2009',
      grid: 'autoplace'
    }
  }
}

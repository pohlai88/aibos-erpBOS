module.exports = {
  forbidden: [
    { name: 'no-cycles', from: {}, to: { circular: true } },
    { name: 'no-app-to-packages', from: { path: '^packages' }, to: { path: '^apps' } },
    { name: 'services-only-contracts', from: { path: '^packages/services' }, to: { pathNot: '^packages/(services|contracts)' } }
  ]
};

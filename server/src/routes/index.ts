export default [
  {
    method: 'GET',
    path: '/options',
    handler: 'options.getOptions',
    config: {
      auth: false,
    },
  },
];

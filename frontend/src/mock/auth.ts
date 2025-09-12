import Mock from 'mockjs';

Mock.mock(/\/auth\/login/, 'post', {
  success: true,
  message: 'Login successful',
  'data|1': {
    token: '@guid',
    user: {
      id: '@id',
      username: '@name',
      email: '@email',
      role: 'USER',
    },
  },
});

Mock.mock(/\/auth\/register/, 'post', {
  success: true,
  message: 'Registration successful',
  'data|1': {
    id: '@id',
    username: '@name',
    email: '@email',
    role: 'USER',
  },
});
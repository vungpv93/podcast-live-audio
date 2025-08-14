export interface IUser {
  id: number;
  name: string;
}

export interface IComment {
  id: number;
  message: string;
  user: IUser;
}

export const comments: IComment[] = [
  {
    id: 1,
    message: 'Lorem Ipsum passages, and more recently with desktop publishing',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 2,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 3,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 4,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 5,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 6,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 7,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 8,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 9,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 10,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 11,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 12,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 13,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 14,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 15,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 16,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 17,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 18,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
  {
    id: 19,
    message: 'Lorem Ipsum passages, and more recently with desktop',
    user: { id: 1, name: 'Alice' },
  },
];

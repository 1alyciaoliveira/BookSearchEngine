const { User, Book } = reqyure('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        users: async () => {
            return User.find().populate('savedBooks');
        },
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('savedBooks');
        },
        books: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Book.find(params).sort({ createdAt: -1 });
        },
        book: async (parent, { bookId }) => {
            return Book.findOne({ bookId });
        },
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Sorry, you are not logged in');
        },
    },
    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
                const token = signToken(user);
                return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Please, check your credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Please, check your credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { authors, description, bookId, image, link, title }, context) => {
            if (context.user) {
                const book = await Book.create({
                    authors,
                    description,
                    bookId,
                    image,
                    link,
                    title,
                });

                await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: book._id } },
                );

                return book;
            }

            throw new AuthenticationError('Sorry, you are not logged in');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const book = await Book.findOneAndDelete({
                    _id: bookId,
                });

                await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: book._id } },
                );

                return book;
            }

            throw new AuthenticationError('Sorry, you are not logged in');
        },

    },
};

module.exports = resolvers;
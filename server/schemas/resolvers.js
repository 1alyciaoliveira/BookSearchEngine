const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
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
               
                const userData = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: { authors, description, bookId, image, link, title } } },
                );

                return userData;
            }

            throw new AuthenticationError('Sorry, you are not logged in');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
               
               const updateUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                );

                return updateUser;
            }

            throw new AuthenticationError('Sorry, you are not logged in');
        },

    },
};

module.exports = resolvers;
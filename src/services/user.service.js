import User from "../models/user.model.js";

export const createUserService = (data) => User.create(data);
export const getUsersService = () => User.find();

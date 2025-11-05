import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend.

  const { fullName, email, userName, password } = req.body;
  // validate user credintials.
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // if user already exists: by username and email.
  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exist with this email or username ");
  }

  // check for iamges and avatar.
  const avatarImageLocalPath = req.files?.avatar?.[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //  let coverImageLocalPath;
  //  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  //   coverImageLocalPath = req.files.coverImage[0].path
  //  }
  if (!avatarImageLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // upload images and avater to cloudinary.
  const avatar = await uploadOnCloudinary(avatarImageLocalPath);

  // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

  // Upload only if cover image is provided
  let coverImage = null;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // check images successfully saved in cloudinary.
  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }

  // finaly create user object and save into database.
  const newUser = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  // remove password and refresh token field from response.
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  // check user is created successfully or not.
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while register user in database"
    );
  }
  // if user created then send the return response.
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User is created successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  //req body -> data form user
  const { userName, email, password } = req.body;
  // username or email
  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }

  //find the user
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found with this email or username");
  }

  // password check
  const isMatchedPassword = await user.isPasswordCorrect(password);
  if (!isMatchedPassword) {
    throw new ApiError(401, "Password incorrect!");
  }
  //generate access and refress token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // send the access token to user cookies and store the refresh token into user database
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

export const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unouthorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access token refreshed sucessfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token!");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All fields are required!");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      400,
      "new password and confirm password dose not match!"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

export const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(401, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avtar is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar is updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image is updated successfully"));
});

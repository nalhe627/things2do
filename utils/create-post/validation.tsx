import { Alert } from "react-native";
import { Post, LocationDetails } from "../../types/ui-models";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

/**
 * This file contains the field validation functions for create-post.
 *
 * @author Chris Eberle
 */

/**
 * This function validates all fields of a post before submission.
 *
 * @param postData - the post data to validate
 * @returns
 */
export const validatePost = (postData: Post): boolean => {
  const invalidFields: string[] = [];

  if (!validTitle(postData.title, 100)) {
    invalidFields.push("Title");
  }

  if (!validDesc(postData.description, 500)) {
    invalidFields.push("Description");
  }
  if (!validTag(postData.tags)) {
    invalidFields.push("Tags");
  }

  if (invalidFields.length > 0) {
    Alert.alert(
      "Missing Required Fields",
      `Please correct the following before posting:\n\n• ${invalidFields.join(
        "\n• "
      )}`
    );
    return false;
  }

  return true;
};

export const validTitle = (
  postName: string,
  postNameCharLimit: number
): boolean => {
  if (postName.trim().length == 0) {
    return false;
  }
  if (postName.trim().length > postNameCharLimit) {
    return false;
  }
  return true;
};

export const validImage = (images: string[]): boolean => {
  if (images.length == 0) {
    return false;
  }
  return true;
};

export const validTag = (tags: string[]): boolean => {
  if (tags.length == 0) {
    return false;
  }
  return true;
};

export const validDesc = (
  postDesc: string,
  postDescCharLimit: number
): boolean => {
  if (postDesc.trim().length == 0) {
    return false;
  }
  if (postDesc.trim().length > postDescCharLimit) {
    return false;
  }
  return true;
};

export const validShortDesc = (
  postShortDesc: string,
  postDescCharLimit: number
): boolean => {
  if (postShortDesc.trim().length == 0) {
    return false;
  }
  if (postShortDesc.trim().length > postDescCharLimit) {
    return false;
  }
  return true;
};

export const validLocation = (address: string): boolean => {
  if (address.trim().length == 0) {
    return false;
  }
  return true;
};

export const validField = (isValid: boolean): string => {
  return isValid ? "bg-green-200" : "bg-red-200";
};

export const validFieldIcon = (isValid: boolean): any => {
  return (
    <Ionicons
      name={isValid ? "checkmark-circle" : "alert-circle"}
      size={20}
      color={isValid ? "green" : "red"}
      style={{
        position: "absolute",
        top: -6,
        right: -6,
        zIndex: 2,
      }}
    />
  );
};

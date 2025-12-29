import { useState } from "react";
import { Image, ScrollView } from "react-native";
import { ThemedText } from "@/components/themed-text";
import * as ImagePicker from "expo-image-picker";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";
import { Ionicons } from "@expo/vector-icons";
import { Colors, THEME } from "@/constants/theme";
import { useThemeContext } from "@/constants/theme-context";
import { ThemedTextInput } from "@/components/themed-text-input";
import { SectionDivider } from "@/components/section-divider";
import { supabase } from "@/utils/supabase";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { createPostWithImages } from "@/api/create-post";
import { Slider } from "@miblanchard/react-native-slider";
import ConfirmActionModal from "@/components/ConfirmationActionModal";
import "@/global.css";

// constants and interface imports
import { AVAILABLE_TAGS, POST_LIMITS } from "@/utils/create-post/constants";
import { Post, LocationDetails, PricingType } from "@/types/ui-models";

// validation imports
import {
  validTitle,
  validDesc,
  validShortDesc,
  validLocation,
  validField,
  validatePost,
  validFieldIcon,
  validTag,
} from "@/utils/create-post/validation";

/**
 *
 * This page allows users to create a new post by filling out a form.
 *
 * Feaures:
 * - share button
 * - reset button
 * - Name of thing field
 * - image upload field
 * - tags field
 * - description field
 * - location field
 * - date and time field
 * - cost field
 *
 * @author Chris Eberle
 * @returns A screen for creating a new post with a header and input field.
 */
export default function CreatePostScreen() {
  const { theme } = useThemeContext();

  const sideMargin = " w-16/18 ";
  // Confirmation modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // POST NAME
  const [postName, setPostName] = useState("");
  // DESC
  const [postDesc, setPostDesc] = useState("");
  const [postShortDesc, setPostShortDesc] = useState("");
  // COST
  // --- Pricing state ---
  const [cost, setCost] = useState<string>("0");
  const [pricingType, setPricingType] = useState<PricingType>("free");

  // TAGS
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const filteredTags = AVAILABLE_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(tag)
  );
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Date state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  // Location state
  const [locName, setLocName] = useState(""); // CANNOT BE NULL
  const [locAddress, setLocAddress] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locState, setLocState] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [locPostalCode, setLocPostalCode] = useState("");
  const [locLatitude, setLocLatitude] = useState(0.0);
  const [locLongitude, setLocLongitude] = useState(0.0);

  // IMAGES
  const [images, setImages] = useState<string[]>([]);
  const handleUploadPhotos = async () => {
    if (images.length >= POST_LIMITS.maxImages) {
      alert("You can upload up to " + POST_LIMITS.maxImages + " images only.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: POST_LIMITS.maxImages - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImages((prev) =>
        [...prev, ...newUris].slice(0, POST_LIMITS.maxImages)
      );
    }
  };

  const packageLocationData = (): LocationDetails => {
    // package gathered location data
    const locData: LocationDetails = {
      name: locName,
      address: locAddress,
      city: locCity,
      state: locState,
      country: locCountry,
      postal_code: locPostalCode,
      latitude: locLatitude,
      longitude: locLongitude,
    };
    // create locaiton name string from data
    locData.name =
      locAddress +
      ", " +
      locCity +
      ", " +
      locState +
      ", " +
      locPostalCode +
      ", " +
      locCountry;

    return locData;
  };

  // HEADER
  const handleShare = async () => {
    // prevent double tap
    if (isSubmitting) return;
    setIsSubmitting(true);

    // package location data
    const locData = packageLocationData();

    // Grab userId, if not existent alert & return
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // package post data
    const postData: Post = {
      userId: user.id,
      title: postName,
      description: postDesc,
      short_description: postShortDesc,
      tags,
      image_urls: images,
      location: locData,
      start_date: startDate ? startDate.toISOString().split("T")[0] : undefined,
      end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      pricing_type: pricingType,
    };

    // Validate data
    if (!validatePost(postData)) {
      setIsSubmitting(false);
      return;
    }

    // Check if post data is valid -- return&alert if not
    if (!validatePost(postData)) return;

    // Attemot to write post to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newPost = await createPostWithImages(postData);

      console.log("Created post ID:", newPost.id);
      alert("Post shared successfully!");
      handleReset();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to share post");
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetLocationFields = () => {
    setLocName("");
    setLocAddress("");
    setLocCity("");
    setLocState("");
    setLocCountry("");
    setLocPostalCode("");
    setLocLatitude(0.0);
    setLocLongitude(0.0);
  };

  const handleReset = () => {
    setPostName("");
    setPostDesc("");
    setPostShortDesc("");
    setTags([]);
    setNewTag("");
    setImages([]);
    setIsAddingTag(false);
    setCost("");
    setStartDate(null);
    setEndDate(null);
    resetLocationFields();
    setPricingType("free");
  };

  return (
    <ThemedView variant="muted" className="flex-1">
      {/* Header */}
      <ThemedView
        variant="muted"
        className="w-full h-20 flex-row items-center justify-between px-4 py-3"
      >
        {/* Reset on the left */}
        <ThemedPressable
          variant="background"
          className="px-2 py-2 rounded-xl items-center justify-center flex-row shadow-md"
          onPress={() => setShowResetModal(true)}
        >
          <Ionicons name="refresh" size={24} color={Colors[theme].text} />
        </ThemedPressable>

        {/* Share on the right */}
        <ThemedPressable
          variant="foreground"
          className="px-3 py-3 rounded-xl items-center justify-center flex-row shadow-md"
          onPress={() => setShowShareModal(true)}
        >
          <Ionicons
            name="send"
            size={15}
            classname=""
            color={Colors[theme].background}
            style={{ marginRight: 10 }}
          />
          <ThemedText variant="buttonOpposite" className="text-lg">
            Share
          </ThemedText>
        </ThemedPressable>
      </ThemedView>
      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        bounces={false} // optional: prevents overscroll bounce
      >
        {/* POST NAME */}
        <ThemedView
          variant="background"
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 shadow-md"}
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center"
          >
            {/* Field Title */}
            <ThemedText variant="button" className="text-xl">
              Thing Name
            </ThemedText>

            {/* Field char count */}
            <ThemedView
              variant="muted"
              className={
                validField(validTitle(postName, POST_LIMITS.titleCharLimit)) +
                " w-15 h-10 justify-center items-center rounded-lg"
              }
            >
              <ThemedText variant="black" className="text-center text-sm ">
                {postName.length}/{POST_LIMITS.titleCharLimit}
              </ThemedText>
              {/* Validation icon */}
              {validFieldIcon(validTitle(postName, POST_LIMITS.titleCharLimit))}
            </ThemedView>
          </ThemedView>

          <ThemedText variant="subFieldHeader" className="text-lg">
            Title your post with something memorable!
          </ThemedText>

          {/* Title Input */}
          <ThemedView variant="background" className="mt-6 mb-2">
            <ThemedTextInput
              variant="muted"
              textVariant="button"
              placeholder="Enter Thing Name..."
              value={postName}
              onChangeText={setPostName}
              maxLength={POST_LIMITS.titleCharLimit}
            />
          </ThemedView>
        </ThemedView>

        {/* POST HOOK DESC */}
        <ThemedView
          variant="background"
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 shadow-md"}
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center"
          >
            {/* Field Title */}
            <ThemedText variant="button" className="text-xl">
              Hook
            </ThemedText>

            {/* Field char count */}
            <ThemedView
              variant="muted"
              className={
                validField(
                  validShortDesc(postShortDesc, POST_LIMITS.shortDescCharLimit)
                ) + " w-15 h-10 justify-center items-center rounded-lg"
              }
            >
              <ThemedText variant="black" className="text-center text-sm">
                {postShortDesc.length}/{POST_LIMITS.shortDescCharLimit}
              </ThemedText>
              {/* Validation icon */}
              {validFieldIcon(
                validShortDesc(postShortDesc, POST_LIMITS.shortDescCharLimit)
              )}
            </ThemedView>
          </ThemedView>

          <ThemedText variant="subFieldHeader" className="text-lg mb-6">
            Write a catchy hook to grab peoples attention!
          </ThemedText>

          <ThemedTextInput
            variant="muted"
            textVariant="button"
            className="mb-2"
            placeholder="Write a catchy hook to get people excited about your thing..."
            value={postShortDesc}
            onChangeText={setPostShortDesc}
            maxLength={POST_LIMITS.shortDescCharLimit}
            multiline={true}
            multilineHeight={100}
            scrollEnabled={true}
          />
        </ThemedView>

        {/* POST DESC */}
        <ThemedView
          variant="background"
          className={
            sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"
          }
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center"
          >
            {/* Field Title */}
            <ThemedText variant="button" className="text-xl">
              Description
            </ThemedText>

            {/* Field char count */}
            <ThemedView
              variant="muted"
              className={
                validField(validDesc(postDesc, POST_LIMITS.descCharLimit)) +
                " w-15 h-10 justify-center items-center rounded-lg"
              }
            >
              <ThemedText variant="black" className="text-center text-sm">
                {postDesc.length}/{POST_LIMITS.descCharLimit}
              </ThemedText>
              {/* Validation icon */}
              {validFieldIcon(validDesc(postDesc, POST_LIMITS.descCharLimit))}
            </ThemedView>
          </ThemedView>

          <ThemedText variant="subFieldHeader" className="text-lg mb-6">
            Write a more detailed description
          </ThemedText>

          <ThemedTextInput
            variant="muted"
            textVariant="button"
            className="mb-2"
            placeholder="Enter a detailed description of your thing..."
            value={postDesc}
            onChangeText={setPostDesc}
            maxLength={POST_LIMITS.descCharLimit}
            multiline={true}
            multilineHeight={200}
            scrollEnabled={true}
          />
        </ThemedView>

        {/* Photos */}
        <ThemedView
          variant="background"
          className={
            sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"
          }
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center mb-6 w-full"
          >
            {/* Left side: Icon + Title */}
            <ThemedView variant="background" className="flex-row items-center">
              <Ionicons
                name="camera-outline"
                size={30}
                color={Colors[theme].text}
                style={{ marginRight: 10 }}
              />
              <ThemedText variant="button" className="text-xl">
                Photos
              </ThemedText>
            </ThemedView>

            {/* Right side: Count */}
            <ThemedView
              variant="muted"
              className=" w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="button">
                {images.length}/{POST_LIMITS.maxImages}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Flex grid for images */}
          <ThemedView
            variant="background"
            className="flex flex-row flex-wrap justify-between gap-2"
          >
            {Array.from({ length: POST_LIMITS.maxImages }).map((_, index) => {
              const uri = images[index];
              return (
                <ThemedView
                  key={index}
                  className="rounded-3xl relative flex-1 basis-[28%] aspect-square"
                >
                  {uri ? (
                    <>
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color="red"
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          zIndex: 2,
                        }}
                        onPress={() =>
                          setImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      />
                      <Image
                        source={{ uri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 10,
                        }}
                      />
                    </>
                  ) : (
                    <ThemedPressable
                      variant="muted"
                      className="w-full h-full bg-muted rounded-lg items-center justify-center"
                      onPress={handleUploadPhotos}
                    >
                      <ThemedView
                        variant="background"
                        className="rounded-lg"
                        style={{
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(0,0,0,0.9)"
                              : "rgba(255,255,255,0.9)",
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={30}
                          color={Colors[theme].icon}
                        />
                      </ThemedView>
                    </ThemedPressable>
                  )}
                </ThemedView>
              );
            })}
          </ThemedView>
        </ThemedView>

        {/* Tags */}
        <ThemedView
          variant="background"
          className={
            sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"
          }
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center mb-6 w-full"
          >
            {/* Left side: Icon + Title */}
            <ThemedView variant="background" className="flex-row items-center">
              <Ionicons
                name="pricetags-outline"
                size={30}
                color={Colors[theme].text}
                style={{ marginRight: 10 }}
              />
              <ThemedText variant="button" className="text-xl">
                Tags
              </ThemedText>
            </ThemedView>

            {/* Right side: Count */}
            <ThemedView
              variant="muted"
              className={
                validField(validTag(tags)) +
                " w-15 h-10 justify-center items-center rounded-lg"
              }
            >
              <ThemedText variant="black">
                {tags.length}/{POST_LIMITS.maxTags}
              </ThemedText>
              {/* Validation icon */}
              {validFieldIcon(validTag(tags))}
            </ThemedView>
          </ThemedView>

          {/* Selected tags display */}
          <ThemedView
            variant="background"
            className="flex-row items-center gap-2 mb-2 flex-wrap"
          >
            {tags.map((tag) => (
              <ThemedView
                key={tag}
                variant="muted"
                className="flex-row items-center px-3 py-1.5 rounded-lg"
              >
                {/* Tag text on the left */}
                <ThemedText variant="tag">{tag}</ThemedText>

                {/* X on the right, inside same bubble */}
                <ThemedPressable
                  onPress={() => handleRemoveTag(tag)}
                  variant="muted"
                  className="ml-4 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color={Colors[theme].text} />
                </ThemedPressable>
              </ThemedView>
            ))}

            {/* Show "+" button when not adding a tag and limit not reached */}
            {!isAddingTag && tags.length < 5 && (
              <ThemedPressable
                onPress={() => setIsAddingTag(true)}
                variant="muted"
                className="w-9 h-9 rounded-lg items-center justify-center"
              >
                <Ionicons name="add" size={25} color={Colors[theme].text} />
              </ThemedPressable>
            )}
          </ThemedView>

          {/* Show input and filtered tags only when adding */}
          {isAddingTag && tags.length < 5 && (
            <>
              <ThemedTextInput
                variant="default"
                textVariant="button"
                placeholder="Enter a tag"
                value={newTag}
                onChangeText={setNewTag}
              />

              {/* Dropdown with matching tags */}
              {filteredTags.length > 0 ? (
                <ThemedView
                  variant="background"
                  className="rounded-lg shadow-md p-2 flex-row flex-wrap gap-2"
                >
                  {filteredTags.map((tag) => (
                    <ThemedPressable
                      key={tag}
                      onPress={() => {
                        setTags([...tags, tag]);
                        setNewTag("");
                        setIsAddingTag(false);
                      }}
                      variant="muted"
                      className="px-3 py-1.5 rounded-full"
                    >
                      <ThemedText className="text-black text-sm">
                        {tag}
                      </ThemedText>
                    </ThemedPressable>
                  ))}
                </ThemedView>
              ) : (
                <ThemedView
                  variant="muted"
                  className=" w-4/10 rounded-lg shadow-md p-2"
                >
                  <ThemedText variant="button">No matching tags</ThemedText>
                </ThemedView>
              )}
            </>
          )}
        </ThemedView>

        {/* Price Field */}
        <ThemedView
          variant="background"
          className={
            sideMargin +
            "border-opacity-30 rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"
          }
        >
          <ThemedView
            variant="background"
            className="w-full flex-row rounded-lg self-center p-4"
          >
            {(["free", "rsvp", "paid"] as PricingType[]).map((type) => (
              <ThemedPressable
                key={type}
                onPress={() => {
                  setPricingType(type);
                  if (type === "free") {
                    setCost("0");
                  } else if (type === "rsvp") {
                    setCost("");
                  } else if (type === "paid") {
                    setCost("0.01");
                  }
                }}
                className={`flex-1 px-4 py-2 mx-1 rounded-lg items-center justify-center ${
                  pricingType === type ? "bg-blue-500" : THEME[theme].background
                }`}
              >
                <ThemedText
                  variant="button"
                  className={pricingType === type ? "text-white" : "text-black"}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </ThemedPressable>
            ))}
          </ThemedView>
          {/* Show cost input + slider only if 'paid' */}
          {pricingType === "paid" && (
            <ThemedView
              variant="background"
              className="w-full rounded-lg self-center p-4 mt-4"
            >
              {/* Input box */}
              <ThemedTextInput
                variant="muted"
                placeholder="0.01"
                value={cost}
                keyboardType="decimal-pad"
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  if (parts.length > 2) parts.splice(2);
                  const formatted =
                    parts.length === 2
                      ? `${parts[0]}.${parts[1].slice(0, 2)}`
                      : parts[0];
                  setCost(formatted);
                }}
                className="w-1/6 self-center flex-1 text-md mb-2 px-3 py-2 rounded-3xl text-center"
              />

              {/* Slider */}
              <Slider
                value={parseFloat(cost) || 0}
                onValueChange={(value) => {
                  const num = Array.isArray(value) ? value[0] : value;
                  setCost(num.toFixed(2));
                }}
                minimumValue={0.01}
                maximumValue={500}
                step={1}
                thumbTintColor="#3B82F6"
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#d3d3d3"
              />

              <ThemedText variant="button" className="mt-2">
                Selected Price: ${parseFloat(cost || "0").toFixed(2)}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Thing Dates */}
        <ThemedView
          className={
            sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"
          }
          variant="background"
        >
          {/* field title */}
          <ThemedView
            className="flex-row items-center mb-6"
            variant="background"
          >
            <Ionicons
              name="calendar-outline"
              size={25}
              color={Colors[theme].text}
              style={{ marginRight: 10 }}
            />
            <ThemedText className="text-xl" variant="button">
              Thing Date
            </ThemedText>
          </ThemedView>

          {/* START & END DATE BUTTONS SIDE BY SIDE */}
          <ThemedView
            className="flex-row justify-between gap-4"
            variant="background"
          >
            {/* START DATE */}
            <ThemedView className="flex-1" variant="background">
              <ThemedText className="text-md mb-2" variant="button">
                Start Date
              </ThemedText>
              <ThemedPressable
                variant="muted"
                className="px-3 py-3 shadow-md rounded-lg"
                onPress={() => setStartPickerVisible(true)}
              >
                <ThemedText variant="button">
                  {startDate ? startDate.toLocaleDateString() : "Pick a Date"}
                </ThemedText>
              </ThemedPressable>
            </ThemedView>

            {/* END DATE */}
            <ThemedView className="flex-1" variant="background">
              <ThemedText className="text-md mb-2 " variant="button">
                End Date
              </ThemedText>
              <ThemedPressable
                variant="muted"
                className="px-3 py-3 rounded-lg shadow-md"
                onPress={() => {
                  if (!startDate) {
                    alert("Please select a start date first.");
                    return;
                  }
                  setEndPickerVisible(true);
                }}
              >
                <ThemedText variant="button">
                  {endDate ? endDate.toLocaleDateString() : "Pick a Date"}
                </ThemedText>
              </ThemedPressable>
            </ThemedView>
          </ThemedView>

          {/* DATE PICKERS */}
          <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="date"
            onConfirm={(date) => {
              setStartDate(date);
              setStartPickerVisible(false);
              if (endDate && date > endDate) {
                setEndDate(null);
              }
            }}
            onCancel={() => setStartPickerVisible(false)}
          />

          <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="date"
            onConfirm={(date) => {
              if (startDate && date < startDate) {
                alert("End date cannot be before start date.");
                return;
              }
              setEndDate(date);
              setEndPickerVisible(false);
            }}
            onCancel={() => setEndPickerVisible(false)}
          />

          {/* SUMMARY */}
          {(startDate || endDate) && (
            <ThemedText variant="button" className="mt-3 text-center">
              {startDate && endDate
                ? `Thing Duration: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`
                : startDate
                ? `Thing On: ${startDate.toLocaleDateString()}`
                : ""}
            </ThemedText>
          )}
        </ThemedView>

        {/* Location Field */}
        <ThemedView
          variant="background"
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 shadow-md"}
        >
          <ThemedView className="flex-row items-center" variant="background">
            <Ionicons
              name="location-outline"
              size={25}
              color={Colors[theme].text}
              style={{ marginRight: 10 }}
            />
            <ThemedText variant="button" className="text-xl">
              Thing Location
            </ThemedText>
          </ThemedView>
          <ThemedView
            variant="background"
            //className="w-full rounded-lg self-center p-4 mt-4"
            className={" w-full rounded-lg self-center p-4 mt-4"}
          >
            <ThemedTextInput
              variant="muted"
              placeholder="Enter address..."
              value={locAddress}
              onChangeText={setLocAddress}
            />
            <SectionDivider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter Country..."
              value={locCountry}
              onChangeText={setLocCountry}
            />
            <SectionDivider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter State/Province..."
              value={locState}
              onChangeText={setLocState}
            />
            <SectionDivider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter City..."
              value={locCity}
              onChangeText={setLocCity}
            />
            <SectionDivider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter Zip Code..."
              value={locPostalCode}
              onChangeText={setLocPostalCode}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <ConfirmActionModal
          title="Reset Post?"
          message="Are you sure you want to reset all fields? Your current progress will be lost."
          confirmText="Reset"
          cancelText="Cancel"
          onConfirm={() => {
            handleReset();
            setShowResetModal(false);
          }}
          onCancel={() => setShowResetModal(false)}
        />
      )}

      {/* Share Confirmation Modal */}
      {showShareModal && (
        <ConfirmActionModal
          title="Share Post?"
          message="Do you want to share this post publicly?"
          confirmText="Share"
          cancelText="Cancel"
          onConfirm={() => {
            setShowShareModal(false);
            handleShare();
          }}
          onCancel={() => setShowShareModal(false)}
        />
      )}
    </ThemedView>
  );
}

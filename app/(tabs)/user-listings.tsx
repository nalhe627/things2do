import React, { useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  Alert,
  View,
  Image as RNImage,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/constants/theme-context";
import { supabase } from "@/utils/supabase";
import {
  getUserListings,
  deleteUserListing,
  updateUserListing,
} from "@/api/dashboard/user-listings";
import { Post, PricingType, LocationDetails } from "@/types/ui-models";
import { ThemedTextInput } from "@/components/themed-text-input";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Slider } from "@miblanchard/react-native-slider";

// Constants
const POST_LIMITS = {
  titleCharLimit: 50,
  shortDescCharLimit: 100,
  descCharLimit: 500,
  maxImages: 5,
  maxTags: 5,
};

const AVAILABLE_TAGS = [
  "Outdoor",
  "Indoor",
  "Free",
  "Food & Drink",
  "Sports",
  "Art & Culture",
  "Music",
  "Nightlife",
  "Family Friendly",
  "Adventure",
  "Relaxation",
  "Shopping",
  "Education",
  "Social",
  "Fitness",
  "Nature",
  "Photography",
  "Gaming",
  "Tech",
  "Crafts",
  "Festival",
  "Weekend",
];

export default function DashboardScreen() {
  const { theme } = useThemeContext();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Edit State (Conditional Rendering instead of Modal)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [postName, setPostName] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postShortDesc, setPostShortDesc] = useState("");
  const [cost, setCost] = useState<string>("0");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Location State
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locState, setLocState] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [locPostalCode, setLocPostalCode] = useState("");
  const [locLatitude, setLocLatitude] = useState(0.0);
  const [locLongitude, setLocLongitude] = useState(0.0);

  const filteredTags = AVAILABLE_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(tag)
  );

  const fetchListings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const data = await getUserListings(user.id);
        setListings(data || []);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserListing(id);
              setListings((prev) => prev.filter((item) => item.id !== id));
            } catch (e) {
              Alert.alert("Error", "Failed to delete listing");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setPostName(post.title || "");
    setPostDesc(post.description || "");
    setPostShortDesc(post.short_description || "");
    setCost(post.cost ? post.cost.toString() : "0");
    setPricingType(post.pricing_type || "free");
    setTags(post.tags || []);
    setImages(post.image_urls || []);
    setStartDate(post.start_date ? new Date(post.start_date) : null);
    setEndDate(post.end_date ? new Date(post.end_date) : null);

    if (post.location) {
      setLocName(post.location.name || "");
      setLocAddress(post.location.address || "");
      setLocCity(post.location.city || "");
      setLocState(post.location.state || "");
      setLocCountry(post.location.country || "");
      setLocPostalCode(post.location.zip_code || "");
      setLocLatitude(post.location.latitude || 0);
      setLocLongitude(post.location.longitude || 0);
    } else {
      setLocName("");
      setLocAddress("");
      setLocCity("");
      setLocState("");
      setLocCountry("");
      setLocPostalCode("");
    }

    setIsEditing(true);
  };

  const handleUploadPhotos = async () => {
    if (images.length >= POST_LIMITS.maxImages) {
      alert("Max images reached");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required");
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

  const saveEdit = async () => {
    if (!editingId) return;

    const locData: LocationDetails = {
      name: locName || `${locAddress}, ${locCity}`,
      address: locAddress,
      city: locCity,
      state: locState,
      country: locCountry,
      postal_code: locPostalCode,
      latitude: locLatitude,
      longitude: locLongitude,
    };

    const updates: Partial<Post> = {
      title: postName,
      description: postDesc,
      short_description: postShortDesc,
      tags,
      image_urls: images,
      location: locData,
      start_date: startDate ? startDate.toISOString().split("T")[0] : undefined,
      end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
      cost: cost ? parseFloat(cost) : 0,
      pricing_type: pricingType,
    };

    try {
      await updateUserListing(editingId, updates);
      setIsEditing(false);
      fetchListings();
      Alert.alert("Success", "Listing updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update listing");
    }
  };

// EDIT VIEW
if (isEditing) {
  // Constants derived from create-post.tsx styling
  const sideMargin = " w-16/18 ";

  // Helper for SectionDivider since it's not imported in this snippet
  const Divider = () => (
    <View className="h-[1px] bg-neutral-200 dark:bg-neutral-800 my-2" />
  );

  const titleCharsLeft =
    POST_LIMITS.titleCharLimit - (postName?.length || 0);
  const hookCharsLeft =
    POST_LIMITS.shortDescCharLimit - (postShortDesc?.length || 0);
  const descCharsLeft =
    POST_LIMITS.descCharLimit - (postDesc?.length || 0);

  return (
    <ThemedView variant="muted" className="flex-1 pt-12">
      {/* Top bar */}
      <ThemedView
        variant="muted"
        className="flex-row items-center justify-between px-4 mb-4"
      >
        <ThemedPressable
          onPress={() => setIsEditing(false)}
          className="p-2 rounded-full bg-neutral-200/10"
        >
          <Ionicons name="arrow-back" size={26} color={Colors[theme].text} />
        </ThemedPressable>

        <View className="items-center">
          <ThemedText variant="button" className="text-lg">
            Edit listing
          </ThemedText>
        </View>

        {/* spacer to balance back button */}
        <View className="w-10" />
      </ThemedView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
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
            <ThemedText variant="button" className="text-xl">
              Thing Name
            </ThemedText>

            <ThemedView
              variant="muted"
              className="w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="black" className="text-center text-sm">
                {postName.length}/{POST_LIMITS.titleCharLimit}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText variant="subFieldHeader" className="text-lg">
            Title your post with something memorable!
          </ThemedText>

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
            <ThemedText variant="button" className="text-xl">
              Hook
            </ThemedText>

            <ThemedView
              variant="muted"
              className="w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="black" className="text-center text-sm">
                {postShortDesc.length}/{POST_LIMITS.shortDescCharLimit}
              </ThemedText>
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
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"}
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center"
          >
            <ThemedText variant="button" className="text-xl">
              Description
            </ThemedText>

            <ThemedView
              variant="muted"
              className="w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="black" className="text-center text-sm">
                {postDesc.length}/{POST_LIMITS.descCharLimit}
              </ThemedText>
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
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"}
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center mb-6 w-full"
          >
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

            <ThemedView
              variant="muted"
              className=" w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="button">
                {images.length}/{POST_LIMITS.maxImages}
              </ThemedText>
            </ThemedView>
          </ThemedView>

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
                      <RNImage
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
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"}
        >
          <ThemedView
            variant="background"
            className="flex-row justify-between items-center mb-6 w-full"
          >
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

            <ThemedView
              variant="muted"
              className="w-15 h-10 justify-center items-center rounded-lg"
            >
              <ThemedText variant="black">
                {tags.length}/{POST_LIMITS.maxTags}
              </ThemedText>
            </ThemedView>
          </ThemedView>

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
                <ThemedText variant="tag">{tag}</ThemedText>
                <ThemedPressable
                  onPress={() => setTags(tags.filter((t) => t !== tag))}
                  variant="muted"
                  className="ml-4 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color={Colors[theme].text} />
                </ThemedPressable>
              </ThemedView>
            ))}

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

          {isAddingTag && tags.length < 5 && (
            <>
              <ThemedTextInput
                variant="default"
                textVariant="button"
                placeholder="Enter a tag"
                value={newTag}
                onChangeText={setNewTag}
              />

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
          className={sideMargin + "border-opacity-30 rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"}
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
                  pricingType === type
                    ? "bg-blue-500"
                    : theme === "dark"
                    ? "bg-neutral-900"
                    : "bg-white"
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

          {pricingType === "paid" && (
            <ThemedView
              variant="background"
              className="w-full rounded-lg self-center p-4 mt-4"
            >
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
          className={sideMargin + "rounded-2xl self-center p-4 mt-6 mb-4 shadow-md"}
          variant="background"
        >
          <ThemedView className="flex-row items-center mb-6" variant="background">
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

          <ThemedView
            className="flex-row justify-between gap-4"
            variant="background"
          >
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
            className={" w-full rounded-lg self-center p-4 mt-4"}
          >
            <ThemedTextInput
              variant="muted"
              placeholder="Enter address..."
              value={locAddress}
              onChangeText={setLocAddress}
            />
            <Divider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter Country..."
              value={locCountry}
              onChangeText={setLocCountry}
            />
            <Divider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter State/Province..."
              value={locState}
              onChangeText={setLocState}
            />
            <Divider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter City..."
              value={locCity}
              onChangeText={setLocCity}
            />
            <Divider />
            <ThemedTextInput
              variant="muted"
              placeholder="Enter Zip Code..."
              value={locPostalCode}
              onChangeText={setLocPostalCode}
            />
          </ThemedView>
        </ThemedView>

        {/* SAVE BUTTON */}
        <ThemedPressable
          onPress={saveEdit}
          className={`${sideMargin} self-center mb-8 mt-4 rounded-2xl bg-blue-600 py-4 items-center shadow-lg shadow-blue-500/30`}
        >
          <ThemedText className="text-white font-semibold text-base">
            Save changes
          </ThemedText>
        </ThemedPressable>
      </ScrollView>
    </ThemedView>
  );
}


  // DASHBOARD VIEW
  return (
    <ThemedView variant="background" className="flex-1 pt-12 px-4">
      <ThemedView className="mb-6">
        <ThemedText variant="header" className="text-3xl">
          Dashboard
        </ThemedText>
        <ThemedText variant="muted">Manage your things to do</ThemedText>
      </ThemedView>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : listings.length === 0 ? (
          <ThemedView className="items-center justify-center py-10">
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors[theme].icon}
            />
            <ThemedText className="mt-4">No listings found.</ThemedText>
          </ThemedView>
        ) : (
          <View className="gap-4 pb-20">
            {listings.map((item) => (
              <ThemedView
                key={item.id}
                variant="muted"
                className="p-4 rounded-2xl shadow-sm flex-row gap-4"
              >
                <Image
                  source={{
                    uri:
                      item.image_urls?.[0] ||
                      "https://placehold.co/100x100/cccccc/000000?text=No+Image",
                  }}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                  contentFit="cover"
                />
                <View className="flex-1 justify-between">
                  <View>
                    <ThemedText variant="button" numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <ThemedText
                      variant="muted"
                      className="text-xs mt-1"
                      numberOfLines={2}
                    >
                      {item.short_description || "No description"}
                    </ThemedText>
                  </View>
                  <View className="flex-row justify-end gap-3 mt-2">
                    <ThemedPressable
                      onPress={() => handleEdit(item)}
                      className="bg-blue-500 px-3 py-1.5 rounded-lg"
                    >
                      <ThemedText className="text-white text-xs font-bold">
                        Edit
                      </ThemedText>
                    </ThemedPressable>
                    <ThemedPressable
                      onPress={() => handleDelete(item.id)}
                      className="bg-red-500 px-3 py-1.5 rounded-lg"
                    >
                      <ThemedText className="text-white text-xs font-bold">
                        Delete
                      </ThemedText>
                    </ThemedPressable>
                  </View>
                </View>
              </ThemedView>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

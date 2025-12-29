import { Pressable, View, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedPressable } from '@/components/themed-pressable';
import { Event, deleteSavedEvent } from '@/api/events';
import { useAuth } from '@/context/auth';

/**
 * UI modal that will popop when the user clicks the delete button in the detailed view of an event.
 * 
 * @param props.event An object representing the event to be deleted from the user's list of saved events.
 * @param props.setCancelled A function that sets the `cancelled` state to `true` when the cancel button is pressed.
 * @returns A UI component that acts as a confirmation modal when the user wants to delete an event.
 */
export default function DeleteEventModal(
  { event, savedEvents, setSavedEvents, setCancelled, setPressed, testID }: {
    event: Event;
    savedEvents: Event[];
    setSavedEvents: (savedEvents: Event[]) => void;
    setCancelled: (cancelled: boolean) => void;
    setPressed: (isPressed: boolean) => void;
    testID: string;
  },
) {
  const { user } = useAuth();

  /** Cancel the deletion of an event on the user's ThingDeck. */
  const cancelEventDeletion = () => {
    setCancelled(true);
    console.log(`cancelled deletion of ${event.title}`);
  };

  /** Deletes the event from the user's ThingDeck. */
  const onDelete = async () => {
    try {
      if (user?.id) {
        setSavedEvents(savedEvents.filter((e) => e !== event));
        await deleteSavedEvent(user.id, event.id);
        
        console.log(`deleted ${event.title}`);
        Alert.alert('Success', `Deleted the event "${event.title}"`);
      } else {
        throw new Error('Invalid user');
      }
    } catch (err: any) {
      console.error(`Error occured when attempting to delete ${event}: ${err}`);
      Alert.alert('Error', `Failed to delete the event "${event.title}"`);
    } finally {
      setCancelled(true);
      setPressed(false);
    }
  };

  return (
    <View className="absolute inset-0" testID={testID}>
      {/* Opaque background */}
      <View className="absolute inset-0 bg-black opacity-40"></View>

      {/* Main moddal */}
      <ThemedView
        variant="popover"
        className="p-6 mx-5 my-auto rounded-lg shadow-lg"
      >
        <ThemedText variant="subheader" className="text-center mb-5">
          Are you sure you want to delete &quot;{event.title}&quot;?
        </ThemedText>
        <View className="w-full flex-row justify-between mx-auto mt-auto px-5">
          {/* Cancel Button */}
          <ThemedPressable
            onPress={cancelEventDeletion}
            className="px-8 py-2 rounded-lg"
          >
            <ThemedText variant="subheader">Cancel</ThemedText>
          </ThemedPressable>
          {/* Delete Button */}
          <Pressable
            onPress={onDelete}
            className="px-8 py-2 rounded-lg bg-red-200"
          >
            <ThemedText variant="subheader" className="text-red-700">
              Delete
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </View>
  );
}
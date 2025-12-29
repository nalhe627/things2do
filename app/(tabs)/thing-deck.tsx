import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState, useCallback } from 'react';
import { Event, getSavedEvents } from '@/api/events';
import SavedEvent from '@/components/thing-deck/SavedEvent';
import DetailedEvent from '@/components/thing-deck/DetailedEvent';
import { useAuth } from '@/context/auth';

/**
 * Main UI for the "ThingDeck" page.
 * 
 * Shows every event saved by the user as cards.
 * 
 * The user can press on a saved event to view detailed information of it.
 * 
 * The detailed view also has an delete button for when the user wants to delete the event from their list of saved events.
 * 
 * @returns The entire UI page for ThingDeck.
 */
export default function ThingDeckScreen() {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useAuth();

  // Need 2 separate states to stop displaying the detailed view properly
  const [isPressed, setPressed] = useState<boolean>(false);
  const [pressedEvent, setPressedEvent] = useState<Event | null>(null);
  
  // Pull-to-refresh handler
  // TODO: change it so that it doesnt cover the entire page with a reload page
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      if (user?.id) {
        const events = await getSavedEvents(user.id);
        setSavedEvents(events);
      }
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
      setLoading(false)
    }
  }, [user?.id]);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      const events = await getSavedEvents(userId);
      setSavedEvents(events);
    } catch (err: any) {
      console.error('Error fetching saved events: ', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's saved event data once
  useEffect(() => {
    if (user?.id) {
      fetchUserData(user.id);
    }
  }, [user?.id]);

  // Display loading screen while data is being fetched
  if (loading) {
    return (
      <ThemedView variant="secondary" className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </ThemedView>
    )
  }

  return (
    <ThemedView className="h-full">
      <ScrollView refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}>
        </RefreshControl>
      }>
        <ThemedView className="px-6 flex-1 gap-4 pb-6">
          <ThemedView className="gap-1 pt-8 mb-4">
            <ThemedText variant="header">ThingDeck</ThemedText>
            <ThemedText variant="subheader">
              Your saved events, locations, and activities
            </ThemedText>
          </ThemedView>

          {/* Display list of user's saved events (if any) */}
          {savedEvents.length > 0 ? (
            savedEvents.map((event, i) => (
              <SavedEvent
                key={i}
                event={event}
                onEventPress={setPressed}
                setEvent={setPressedEvent}
              />
            ))
          ) : (
            <ThemedText variant="faded" className="text-center pt-20">
              No saved events
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>

      {/* Dispaly detailed info of saved event if pressed on */}
      {isPressed && pressedEvent && (
        <DetailedEvent 
          event={pressedEvent} 
          savedEvents={savedEvents} 
          setSavedEvents={setSavedEvents} 
          onEventPress={setPressed}
        />
      )}
    </ThemedView>
  );
}

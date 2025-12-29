import { render, screen, renderHook } from '@testing-library/react-native';
import { featuredEvent } from '@/api/events';
import { ThemeContext } from "@/constants/theme-context";
import { useTheme } from "@/hooks/mocks/use-theme";
import SavedEvent from '@/components/thing-deck/SavedEvent';

describe('ThingDeck: <SavedEvent />', () => {
    // Mock the state handlers being passed into SavedEvent component
    const onEventPressMock = jest.fn();
    const setEventMock = jest.fn();

    // Render the useTheme mock for tests
    const { setTheme, theme } = renderHook(() => useTheme()).result.current;

    it('contains correct event title', () => {
        render(
            <ThemeContext.Provider value={{ setTheme, theme }}>
                <SavedEvent 
                    event={featuredEvent} 
                    onEventPress={onEventPressMock} 
                    setEvent={setEventMock}
                />
            </ThemeContext.Provider>
        );

        expect(screen.getByText(featuredEvent.title)).toHaveTextContent(featuredEvent.title);
    });
});

import { render, screen, renderHook, fireEvent } from '@testing-library/react-native';
import { featuredEvent } from '@/api/events';
import { ThemeContext } from "@/constants/theme-context";
import { useTheme } from '@/hooks/mocks/use-theme';
import DetailedEvent from '@/components/thing-deck/DetailedEvent';

describe('ThingDeck: <DetailedEvent />', () => {
    // Mock the state handler being passed into <DetailEvent />
    const onEventPressMock = jest.fn();
    const setSavedEventsMock = jest.fn();

    // Render the useTheme mock for tests
    const { setTheme, theme } = renderHook(() => useTheme()).result.current;

    it('contains correct description', () => {
        render(
            <ThemeContext.Provider value={{ setTheme, theme }}>
                <DetailedEvent
                    event={featuredEvent} 
                    savedEvents={[]}
                    onEventPress={onEventPressMock}
                    setSavedEvents={setSavedEventsMock}
                />
            </ThemeContext.Provider>
        )

        expect(screen.getByText(featuredEvent.description)).toHaveTextContent(featuredEvent.description);
    });

    it('renders <DeleteEventModal /> when delete button is pressed', () => {
        render(
            <ThemeContext.Provider value={{ setTheme, theme }}>
                <DetailedEvent
                    event={featuredEvent} 
                    savedEvents={[]}
                    onEventPress={onEventPressMock}
                    setSavedEvents={setSavedEventsMock}
                />
            </ThemeContext.Provider>
        );

        fireEvent.press(screen.getByRole('button'));
        expect(screen.getByTestId('delete-event-modal')).toBeVisible();
    });
});

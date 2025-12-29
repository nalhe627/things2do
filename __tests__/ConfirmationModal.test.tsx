import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { ConfirmationModal } from '@/components/confirmation-modal';

// Test if the confirmation modal component is properly rendering the title and message.
describe('ConfirmationModal', () => {
  it('renders the confirmation modal', () => {
    render(
      <ConfirmationModal
        visible={true}
        title="Test title"
        message="This is a test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Test title')).toBeVisible();
    expect(screen.getByText('This is a test message')).toBeVisible();
  });
});
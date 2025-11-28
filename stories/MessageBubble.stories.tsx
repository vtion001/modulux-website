import type { Meta, StoryObj } from '@storybook/react'
import { MessageBubble } from '@/components/admin/chat/message-bubble'

const meta: Meta<typeof MessageBubble> = {
  title: 'Admin/Chat/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    from: { control: 'inline-radio', options: ['agent', 'client'] },
  },
}

export default meta
type Story = StoryObj<typeof MessageBubble>

export const Received: Story = {
  args: {
    from: 'client',
    text: 'Let’s use the lighter option.',
    time: '09:42',
  },
}

export const Sent: Story = {
  args: {
    from: 'agent',
    text: 'Not Satisfied',
    time: '09:43',
  },
}

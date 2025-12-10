import { useState } from 'preact/hooks';
import { FloatingButton } from '@/components/FloatingButton';
import { Modal } from '@/components/Modal';
import { TaskPanel } from '@/components/TaskPanel';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {!isModalOpen && <FloatingButton onClick={handleOpenModal} />}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <TaskPanel />
      </Modal>
    </>
  );
}

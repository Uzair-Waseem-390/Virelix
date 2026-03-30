import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { createProject, getAIStatus } from '../../api/projects';
import StepDetails from './create/StepDetails';
import StepAIAnalysis from './create/StepAIAnalysis';
import StepComplete from './create/StepComplete';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isCreating, setIsCreating] = useState(false);
    const [project, setProject] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [aiStatus, setAiStatus] = useState('pending');
    const [aiError, setAiError] = useState('');
    const [pollingInterval, setPollingInterval] = useState(null);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const response = await createProject(formData);
            setProject(response.data.project);
            setCredentials(response.data.member_credentials);
            setTaskId(response.data.task_id);

            if (response.data.ai_warning) {
                console.warn('AI Warning:', response.data.ai_warning);
            }

            setStep(2);

            // Start polling if we have a task_id
            if (response.data.task_id) {
                startPolling(response.data.project.id, response.data.task_id);
            } else {
                // No task_id means AI couldn't run (missing API key)
                setAiStatus('failed');
                setAiError(response.data.ai_warning || 'No Gemini API key configured');
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            alert(error.response?.data?.detail || 'Failed to create project');
            onClose();
        } finally {
            setIsCreating(false);
        }
    };

    const startPolling = (projectId, taskId) => {
        const interval = setInterval(async () => {
            try {
                const response = await getAIStatus(projectId, taskId);
                setAiStatus(response.data.ai_status);

                if (response.data.ai_status === 'done') {
                    // Update project with enabled modules
                    setProject(prev => ({
                        ...prev,
                        enabled_modules: response.data.enabled_modules,
                        has_products: response.data.has_products,
                        has_inventory: response.data.has_inventory,
                        has_sales: response.data.has_sales,
                        ai_status: 'done'
                    }));
                    clearInterval(interval);
                    setPollingInterval(null);
                    setStep(3);
                } else if (response.data.ai_status === 'failed') {
                    setAiError(response.data.ai_error);
                    clearInterval(interval);
                    setPollingInterval(null);
                }
            } catch (error) {
                console.error('Failed to get AI status:', error);
                setAiStatus('failed');
                setAiError(error.response?.data?.detail || 'Failed to check AI status');
                clearInterval(interval);
                setPollingInterval(null);
            }
        }, 3000);

        setPollingInterval(interval);
    };

    const handleRetry = () => {
        setAiStatus('processing');
        setAiError('');
        handleCreate();
    };

    const handleOpenDashboard = () => {
        onProjectCreated(project);
        onClose();
        window.location.href = `/dashboard/projects/${project.id}`;
    };

    const handleClose = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        onClose();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const getModalTitle = () => {
        switch (step) {
            case 1: return 'Create New Project';
            case 2: return 'AI Analysis in Progress';
            case 3: return 'Setup Complete';
            default: return 'Create Project';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()} size="lg">
            {step === 1 && (
                <StepDetails
                    formData={formData}
                    onChange={updateFormData}
                    onNext={handleCreate}
                    isValidating={isCreating}
                />
            )}

            {step === 2 && (
                <StepAIAnalysis
                    status={aiStatus}
                    error={aiError}
                    onRetry={handleRetry}
                />
            )}

            {step === 3 && (
                <StepComplete
                    project={project}
                    credentials={credentials}
                    onOpenDashboard={handleOpenDashboard}
                    onClose={handleClose}
                />
            )}
        </Modal>
    );
};

export default CreateProjectModal;
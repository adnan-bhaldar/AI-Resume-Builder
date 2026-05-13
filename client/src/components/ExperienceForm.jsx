import { Briefcase, Plus, Sparkles, Trash2, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux' // Import for Redux token
import api from '../configs/api'
import toast from 'react-hot-toast'

const ExperienceForm = ({ data, onChange }) => {
    // 1. Get token from Redux exactly like your Summary form
    const { token } = useSelector(state => state.auth)
    const [enhancingIndex, setEnhancingIndex] = useState(null)

    const addExperience = () => {
        const newExperience = {
            company: "",
            position: "",
            start_date: "",
            end_date: "",
            description: "",
            is_current: false,
        };
        onChange([...data, newExperience])
    }

    const removeExperience = (index) => {
        const updated = data.filter((_, i) => i !== index);
        onChange(updated)
    }

    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    // 2. Implementation of similar AI logic
    const handleEnhanceAI = async (index) => {
        const experience = data[index];

        if (!experience.description) {
            return toast.error("Please write a brief description first!");
        }

        try {
            setEnhancingIndex(index);

            // Call the correct endpoint with the token from Redux
            const response = await api.post('/api/ai/enhance-job-desc',
                { userContent: experience.description },
                { headers: { Authorization: token } }
            );

            const newDescription = response.data.enhancedContent;

            if (newDescription) {
                // Update the specific index in the array
                updateExperience(index, "description", newDescription);
                toast.success("Job description enhanced!");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Enhancement failed");
            console.error(error);
        } finally {
            setEnhancingIndex(null);
        }
    }

    return (
        <div className='space-y-6'>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"> Professional Experience </h3>
                    <p className="text-sm text-gray-500">Add Your Job Experience</p>
                </div>
                <button onClick={addExperience} className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    <Plus className='size-4' />
                    Add Experience
                </button>
            </div>

            {data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Briefcase className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                    <p>No Work Experience Added Yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((experience, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium">Experience #{index + 1}</h4>
                                <button onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className='size-4' />
                                </button>
                            </div>

                            {/* Inputs for Company and Position */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <input value={experience.company || ""} onChange={(e) => updateExperience(index, "company", e.target.value)} type="text" placeholder='Company Name' className='px-3 py-2 text-sm border rounded' />
                                <input value={experience.position || ""} onChange={(e) => updateExperience(index, "position", e.target.value)} type="text" placeholder='Job Title' className='px-3 py-2 text-sm border rounded' />
                                <input value={experience.start_date || ""} onChange={(e) => updateExperience(index, "start_date", e.target.value)} type="month" className='px-3 py-2 text-sm border rounded' />
                                <input value={experience.end_date || ""} onChange={(e) => updateExperience(index, "end_date", e.target.value)} type="month" disabled={experience.is_current} className='px-3 py-2 text-sm border rounded disabled:bg-gray-100' />
                            </div>

                            <label className='flex items-center gap-2'>
                                <input type="checkbox" checked={experience.is_current || false} onChange={(e) => { updateExperience(index, "is_current", e.target.checked) }} className="rounded border-gray-300" />
                                <span className="text-sm text-gray-700">Currently Working Here</span>
                            </label>

                            {/* AI Enhance Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Job Description</label>
                                    <button
                                        type="button"
                                        disabled={enhancingIndex === index}
                                        onClick={() => handleEnhanceAI(index)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                                    >
                                        {enhancingIndex === index ? <Loader2 className='w-3 h-3 animate-spin' /> : <Sparkles className='w-3 h-3' />}
                                        {enhancingIndex === index ? 'Enhancing...' : 'Enhance with AI'}
                                    </button>
                                </div>
                                <textarea
                                    value={experience.description || ""}
                                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                                    rows={4}
                                    className='w-full text-sm px-3 py-2 border rounded-lg resize-none outline-none focus:ring-1 focus:ring-purple-400'
                                    placeholder="Describe your key responsibilities and achievements..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ExperienceForm
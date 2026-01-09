import { useState, useEffect } from 'react'

export default function SkillSelector({ selected, onChange, type, disabled }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/users/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data.skills || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load skills:', err)
        setLoading(false)
      })
  }, [])

  function toggleSkill(skill) {
    if (disabled) return
    if (selected.includes(skill)) {
      onChange(selected.filter(s => s !== skill))
    } else {
      onChange([...selected, skill])
    }
  }

  const filteredSkills = skills.filter(skill =>
    skill.toLowerCase().includes(search.toLowerCase())
  )

  const typeLabel = type === 'offer' ? 'Skills I Can Offer' : 'Skills I Need'

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {typeLabel}
        <span className="ml-2 text-gray-500">({selected.length} selected)</span>
      </label>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search skills..."
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
      />

      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredSkills.map(skill => {
            const isSelected = selected.includes(skill)
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                  isSelected
                    ? type === 'offer'
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                    : 'bg-light text-gray-700 border border-gray-200 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSelected && '✓ '}{skill}
              </button>
            )
          })}
        </div>
        {filteredSkills.length === 0 && (
          <p className="text-center text-gray-500 py-4">No skills match your search</p>
        )}
      </div>
    </div>
  )
}

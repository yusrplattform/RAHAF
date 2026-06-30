import React from 'react'

export default function PublicProfile() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <iframe
        src="/public-profile.html"
        title="Rahaf public profile"
        style={{
          width: '100%',
          height: '100vh',
          border: 0,
          display: 'block',
        }}
      />
    </div>
  )
}

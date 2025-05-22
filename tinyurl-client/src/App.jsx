import { useEffect, useState } from 'react'
import './App.css'

const baseUrl = 'http://localhost:5043'

function App() {
  const [longUrl, setLongUrl] = useState('')
  const [code, setCode] = useState('')
  const [urlList, setUrlList] = useState([])

  useEffect(() => {
    const fetchUrls = async () => {
      const response = await fetch(`${baseUrl}/api/shorturls`)
      const data = await response.json()
      setUrlList(data)
    }

    fetchUrls()
  }, [])

  const validateInput = () => {
    let url;
    try {
      url = new URL(longUrl)
    } catch {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleSubmit = async () => {
    if (!validateInput()) {
      alert('Please enter a valid URL');
      setLongUrl('');
      setCode('');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/shorturls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl, customCode: code }),
      })
  
      const data = await response.json()
      if (data) setUrlList((prev) => [...prev, { longUrl: data.longUrl, shortCode: data.shortCode, clicks: data.clicks, shortUrl: data.shortUrl }])
    } catch (error) {
      console.error('Error:', error)
    }
    setLongUrl('')
    setCode('')
  }

  const handleDelete = async (shortCode) => {
    try {
      const response = await fetch(`${baseUrl}/api/shorturls/${shortCode}`, {
        method: 'DELETE',
      })
  
      if (response.ok) {
        setUrlList((prev) => prev.filter((url) => url.shortCode !== shortCode))
      } else {
        console.error('Failed to delete URL')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <>
      <div className="App">
        <h1>URL Shortener</h1>
        <form className='short-url-form'>
          <label for="longUrl">Long URL: <span style={{color:'red'}}>&#42;</span></label>
          <input
            type="url"
            name="longUrl"
            placeholder="Start with http:// or https://"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
          />
          <label for="shortCode">Custom Short Code (optional):</label>
          <input
            type="text"
            name='shortCode'
            placeholder="Enter short code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={handleSubmit}
          >
            Shorten URL
          </button>
        </form>
        <ul className="url-list">
          {urlList.map((url, idx) => (
            <li className="url-list-item" key={idx}>
              <button className='delete-button' onClick={() => handleDelete(url.shortCode)}>Delete</button>
              <a href={url.shortUrl} target='_blank' rel='noopener'>{url.shortUrl} </a>
              <span>Clicked: {url.clicks} times</span>
              <a href={url.longUrl}>{url.longUrl}</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App

import { useEffect, useState } from 'react'
import { API_URL as baseUrl } from './config.ts'
import './App.css'

type urlObj = {
  longUrl: string;
  shortCode: string;
  clicks: number;
  shortUrl: string;
}

function App() {
  const [longUrl, setLongUrl] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [urlList, setUrlList] = useState<Array<urlObj>>([])

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await fetch(`${baseUrl}/shorturls`)
        const data = await response.json()
        setUrlList(data)
      } catch (error) {
        console.error('Error fetching URLs:', error)
      }
    }

    fetchUrls()
  }, [])

  const validateUrl = (input: string): boolean => {
    console.log('Validating URL:', input);
    let url;
    try {
      url = new URL(input)
    } catch {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateUrl(longUrl)) {
      alert('Please enter a valid URL');
      setLongUrl('');
      setCode('');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/shorturls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl, customCode: code }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const data = await response.json()
      if (data) setUrlList((prev) => [...prev, { longUrl: data.longUrl, shortCode: data.shortCode, clicks: data.clicks, shortUrl: data.shortUrl }])
    } catch (error) {
      console.error('Error:', error)
    }
    setLongUrl('')
    setCode('')
  }

  const handleDelete = async (shortCode: string) => {
    try {
      const response = await fetch(`${baseUrl}/shorturls/${shortCode}`, {
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
          <label htmlFor="longUrl">Long URL: <span style={{color:'red'}}>&#42;</span></label>
          <input
            type="url"
            name="longUrl"
            placeholder="Start with http:// or https://"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
          />
          <label htmlFor="shortCode">Custom Short Code (optional):</label>
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

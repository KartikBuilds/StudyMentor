"""
calendar_utils.py
Google Calendar API integration for StudyMentor
Allows users to sync their study plans with Google Calendar
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Calendar API scopes
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarIntegration:
    def __init__(self, credentials_file: str = "credentials.json", token_file: str = "token.json"):
        """
        Initialize Google Calendar integration
        
        Args:
            credentials_file: Path to Google OAuth2 credentials JSON file
            token_file: Path to store user's access token
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.creds = None
        
    def authenticate(self) -> bool:
        """
        Authenticate with Google Calendar API
        
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            # Load existing token if available
            if os.path.exists(self.token_file):
                self.creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
            
            # If there are no (valid) credentials available, let the user log in
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    if not os.path.exists(self.credentials_file):
                        print(f"Credentials file not found: {self.credentials_file}")
                        return False
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, SCOPES)
                    self.creds = flow.run_local_server(port=0)
                
                # Save the credentials for the next run
                with open(self.token_file, 'w') as token:
                    token.write(self.creds.to_json())
            
            # Build the service
            self.service = build('calendar', 'v3', credentials=self.creds)
            return True
            
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return False
    
    def create_calendar(self, calendar_name: str = "StudyMentor - Study Schedule") -> Optional[str]:
        """
        Create a dedicated calendar for StudyMentor events
        
        Args:
            calendar_name: Name for the new calendar
            
        Returns:
            str: Calendar ID if successful, None otherwise
        """
        try:
            calendar = {
                'summary': calendar_name,
                'description': 'AI-generated study schedule from StudyMentor',
                'timeZone': 'UTC'
            }
            
            created_calendar = self.service.calendars().insert(body=calendar).execute()
            return created_calendar['id']
            
        except HttpError as error:
            print(f'Error creating calendar: {error}')
            return None
    
    def get_or_create_study_calendar(self) -> Optional[str]:
        """
        Get existing StudyMentor calendar or create a new one
        
        Returns:
            str: Calendar ID if successful, None otherwise
        """
        try:
            # List all calendars
            calendar_list = self.service.calendarList().list().execute()
            
            # Look for existing StudyMentor calendar
            for calendar in calendar_list.get('items', []):
                if 'StudyMentor' in calendar.get('summary', ''):
                    return calendar['id']
            
            # Create new calendar if not found
            return self.create_calendar()
            
        except HttpError as error:
            print(f'Error getting calendars: {error}')
            return None
    
    def add_study_plan_to_calendar(self, 
                                 study_plan: Dict, 
                                 start_date: datetime,
                                 calendar_id: Optional[str] = None) -> bool:
        """
        Add study plan events to Google Calendar
        
        Args:
            study_plan: Study plan data with daily_plans
            start_date: Start date for the study plan
            calendar_id: Target calendar ID (if None, uses primary calendar)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.service:
                if not self.authenticate():
                    return False
            
            # Use StudyMentor calendar or primary calendar
            if not calendar_id:
                calendar_id = self.get_or_create_study_calendar()
                if not calendar_id:
                    calendar_id = 'primary'
            
            current_date = start_date
            events_created = 0
            
            # Process daily plans
            daily_plans = study_plan.get('daily_plans', {})
            
            for day_name, tasks in daily_plans.items():
                if not tasks:
                    current_date += timedelta(days=1)
                    continue
                
                # Create morning study session (9 AM - 12 PM by default)
                morning_start = current_date.replace(hour=9, minute=0, second=0, microsecond=0)
                morning_end = morning_start + timedelta(hours=3)
                
                # Create afternoon study session (2 PM - 5 PM by default)  
                afternoon_start = current_date.replace(hour=14, minute=0, second=0, microsecond=0)
                afternoon_end = afternoon_start + timedelta(hours=3)
                
                # Split tasks between morning and afternoon
                mid_point = len(tasks) // 2
                morning_tasks = tasks[:mid_point] if mid_point > 0 else tasks[:1]
                afternoon_tasks = tasks[mid_point:] if mid_point > 0 else tasks[1:]
                
                # Create morning event
                if morning_tasks:
                    morning_event = {
                        'summary': f'📚 Study Session - {day_name} (Morning)',
                        'description': self._format_tasks_description(morning_tasks, study_plan),
                        'start': {
                            'dateTime': morning_start.isoformat(),
                            'timeZone': 'UTC',
                        },
                        'end': {
                            'dateTime': morning_end.isoformat(),
                            'timeZone': 'UTC',
                        },
                        'colorId': '10',  # Green color for study events
                        'reminders': {
                            'useDefault': False,
                            'overrides': [
                                {'method': 'popup', 'minutes': 30},
                                {'method': 'popup', 'minutes': 10},
                            ],
                        },
                    }
                    
                    self.service.events().insert(calendarId=calendar_id, body=morning_event).execute()
                    events_created += 1
                
                # Create afternoon event
                if afternoon_tasks:
                    afternoon_event = {
                        'summary': f'📖 Study Session - {day_name} (Afternoon)',
                        'description': self._format_tasks_description(afternoon_tasks, study_plan),
                        'start': {
                            'dateTime': afternoon_start.isoformat(),
                            'timeZone': 'UTC',
                        },
                        'end': {
                            'dateTime': afternoon_end.isoformat(),
                            'timeZone': 'UTC',
                        },
                        'colorId': '10',  # Green color for study events
                        'reminders': {
                            'useDefault': False,
                            'overrides': [
                                {'method': 'popup', 'minutes': 30},
                                {'method': 'popup', 'minutes': 10},
                            ],
                        },
                    }
                    
                    self.service.events().insert(calendarId=calendar_id, body=afternoon_event).execute()
                    events_created += 1
                
                current_date += timedelta(days=1)
            
            print(f"Successfully created {events_created} study events in Google Calendar")
            return True
            
        except HttpError as error:
            print(f'Error adding events to calendar: {error}')
            return False
        except Exception as e:
            print(f'Unexpected error: {str(e)}')
            return False
    
    def _format_tasks_description(self, tasks: List[str], study_plan: Dict) -> str:
        """
        Format task list into a readable description for calendar events
        
        Args:
            tasks: List of study tasks
            study_plan: Complete study plan data
            
        Returns:
            str: Formatted description
        """
        description = "🎯 StudyMentor AI-Generated Study Session\n\n"
        description += "📋 Tasks for this session:\n"
        
        for i, task in enumerate(tasks, 1):
            description += f"{i}. {task}\n"
        
        description += f"\n📊 Plan Overview:\n"
        description += f"• Total Days: {study_plan.get('total_days', 'N/A')}\n"
        description += f"• Total Hours: {study_plan.get('total_hours', 'N/A')}\n"
        description += f"• Subjects: {', '.join(study_plan.get('subjects', []))}\n"
        
        description += "\n💡 Generated by StudyMentor - Your AI Learning Companion"
        
        return description
    
    def delete_study_events(self, calendar_id: Optional[str] = None, days_ahead: int = 30) -> bool:
        """
        Delete existing StudyMentor events from calendar
        
        Args:
            calendar_id: Target calendar ID
            days_ahead: Number of days to look ahead for events
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.service:
                if not self.authenticate():
                    return False
            
            if not calendar_id:
                calendar_id = self.get_or_create_study_calendar()
                if not calendar_id:
                    calendar_id = 'primary'
            
            # Get events for the next N days
            now = datetime.utcnow()
            time_max = now + timedelta(days=days_ahead)
            
            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=now.isoformat() + 'Z',
                timeMax=time_max.isoformat() + 'Z',
                q='StudyMentor',
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            deleted_count = 0
            
            for event in events:
                if 'StudyMentor' in event.get('description', '') or '📚' in event.get('summary', ''):
                    self.service.events().delete(calendarId=calendar_id, eventId=event['id']).execute()
                    deleted_count += 1
            
            print(f"Deleted {deleted_count} existing StudyMentor events")
            return True
            
        except HttpError as error:
            print(f'Error deleting events: {error}')
            return False
        except Exception as e:
            print(f'Unexpected error: {str(e)}')
            return False

# Global instance
calendar_integration = GoogleCalendarIntegration()

def sync_study_plan_to_calendar(study_plan: Dict, start_date: datetime = None) -> Dict:
    """
    Sync study plan to Google Calendar
    
    Args:
        study_plan: Study plan data
        start_date: Start date for the plan (defaults to tomorrow)
        
    Returns:
        Dict: Success status and message
    """
    try:
        if not start_date:
            start_date = datetime.now() + timedelta(days=1)
        
        # Check if credentials file exists
        if not os.path.exists("credentials.json"):
            return {
                "success": False,
                "message": "Google Calendar credentials not found. Please follow the setup guide to create 'credentials.json' file from Google Cloud Console."
            }
        
        # Authenticate with Google Calendar
        if not calendar_integration.authenticate():
            return {
                "success": False,
                "message": "Failed to authenticate with Google Calendar. Please ensure 'credentials.json' is valid and Google Calendar API is enabled in your Google Cloud project."
            }
        
        # Add study plan to calendar
        success = calendar_integration.add_study_plan_to_calendar(study_plan, start_date)
        
        if success:
            return {
                "success": True,
                "message": f"Study plan successfully synced to Google Calendar starting {start_date.strftime('%B %d, %Y')}! Check your calendar for new study sessions."
            }
        else:
            return {
                "success": False,
                "message": "Failed to sync study plan to Google Calendar. Please check your permissions and try again."
            }
            
    except Exception as e:
        error_message = str(e)
        if "FileNotFoundError" in error_message:
            return {
                "success": False,
                "message": "Google Calendar credentials file 'credentials.json' not found. Please follow the setup guide to configure Google Calendar integration."
            }
        elif "forbidden" in error_message.lower():
            return {
                "success": False,
                "message": "Access denied to Google Calendar. Please re-authenticate and grant calendar permissions."
            }
        elif "quota" in error_message.lower():
            return {
                "success": False,
                "message": "Google Calendar API quota exceeded. Please wait a few minutes and try again."
            }
        else:
            return {
                "success": False,
                "message": f"Error syncing to calendar: {error_message}. Please check the setup guide for troubleshooting steps."
            }

def remove_study_plan_from_calendar() -> Dict:
    """
    Remove existing StudyMentor events from Google Calendar
    
    Returns:
        Dict: Success status and message
    """
    try:
        # Authenticate with Google Calendar
        if not calendar_integration.authenticate():
            return {
                "success": False,
                "message": "Failed to authenticate with Google Calendar"
            }
        
        # Delete existing events
        success = calendar_integration.delete_study_events()
        
        if success:
            return {
                "success": True,
                "message": "Successfully removed existing study events from Google Calendar"
            }
        else:
            return {
                "success": False,
                "message": "Failed to remove study events from Google Calendar"
            }
            
    except Exception as e:
        return {
            "success": False,  
            "message": f"Error removing calendar events: {str(e)}"
        }
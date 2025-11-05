import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SignalrService } from '../../services/signalr.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  selectedCategory = 'general';
  private destroy$ = new Subject<void>();

  constructor(private signalrService: SignalrService) {}

  ngOnInit(): void {
    this.signalrService.newPost$
      .pipe(takeUntil(this.destroy$))
      .subscribe((post: Post) => {
        if (post.category === this.selectedCategory || this.selectedCategory === 'all') {
          this.posts.unshift(post);
        }
      });

    this.loadPosts();
    this.subscribeToCategory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.loadPosts();
    this.subscribeToCategory();
  }

  private loadPosts(): void {
    // Load initial posts from API
    // This would call a service to fetch posts
    this.posts = []; // Replace with actual API call
  }

  private subscribeToCategory(): void {
    this.signalrService.subscribeToFeed(this.selectedCategory);
  }

  onPostCreated(post: Post): void {
    // Handle new post creation
    this.posts.unshift(post);
  }
}
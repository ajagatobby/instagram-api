import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InstagramCookieHelper } from 'src/Helpers/cookie-helper';
import axios, { AxiosInstance } from 'axios';
import {
  CommentResponse,
  InstagramPost,
  PaginatedResponse,
} from 'src/types/instagram.types';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseURL = 'https://www.instagram.com';

  constructor(
    private readonly cookieHelper: InstagramCookieHelper,
    private readonly configService: ConfigService,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://www.instagram.com',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
    });
  }

  async addComment(
    mediaId: string,
    commentText: string,
  ): Promise<CommentResponse> {
    try {
      // Validate and clean cookies
      if (
        !this.cookieHelper.validateCookies(
          this.configService.get('INSTAGRAM_COOKIES'),
        )
      ) {
        throw new HttpException(
          'Invalid Instagram cookies',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const cleanedCookies = this.cookieHelper.cleanCookies(
        this.configService.get('INSTAGRAM_COOKIES'),
      );
      const csrfToken = this.cookieHelper.extractCsrfToken(
        this.configService.get('INSTAGRAM_COOKIES'),
      );

      const response = await this.axiosInstance.post(
        `/api/v1/web/comments/${mediaId}/add/`,
        new URLSearchParams({
          comment_text: commentText,
        }),
        {
          headers: {
            Cookie: cleanedCookies,
            'X-Csrftoken': csrfToken,
          },
        },
      );

      // Update cookies from response if present
      if (response.headers['set-cookie']) {
        const newCookies = response.headers['set-cookie'].join('; ');
        this.cookieHelper.updateCookies(
          cleanedCookies,
          this.cookieHelper.parseCookies(newCookies),
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.response?.data?.message || 'Failed to add comment',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserPosts(
    userId: string,
    pageSize: number = 12,
    after?: string,
  ): Promise<PaginatedResponse<InstagramPost>> {
    try {
      // Validate and clean cookies
      if (
        !this.cookieHelper.validateCookies(
          this.configService.get('INSTAGRAM_COOKIES'),
        )
      ) {
        this.logger.error(
          'Invalid Instagram cookies',
          this.configService.get('INSTAGRAM_COOKIES'),
        );
        throw new HttpException(
          'Invalid Instagram cookies',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const cleanedCookies = this.cookieHelper.cleanCookies(
        this.configService.get('INSTAGRAM_COOKIES'),
      );
      const csrfToken = this.cookieHelper.extractCsrfToken(
        this.configService.get('INSTAGRAM_COOKIES'),
      );

      const variables = {
        data: {
          include_feed_video: true,
          page_size: 12,
          target_user_id: userId,
        },
      };

      if (after) {
        variables.data['after'] = after;
      }

      const response = await this.axiosInstance.post(
        '/graphql/query',
        new URLSearchParams({
          doc_id: '8526372674115715',
          variables: JSON.stringify(variables),
        }),
        {
          headers: {
            Cookie: cleanedCookies,
            'X-Csrftoken': csrfToken,
            'X-Fb-Friendly-Name': 'PolarisProfileReelsTabContentQuery',
          },
        },
      );

      // Update cookies from response if present
      if (response.headers['set-cookie']) {
        const newCookies = response.headers['set-cookie'].join('; ');
        this.cookieHelper.updateCookies(
          cleanedCookies,
          this.cookieHelper.parseCookies(newCookies),
        );
      }

      const edges =
        response.data.data.xdt_api__v1__clips__user__connection_v2.edges;
      const pageInfo =
        response.data.data.xdt_api__v1__clips__user__connection_v2.page_info;

      return {
        data: edges.map((edge) => edge.node.media),
        pageInfo: {
          hasNextPage: pageInfo.has_next_page,
          endCursor: pageInfo.end_cursor,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch user posts',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

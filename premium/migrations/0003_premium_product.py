# Generated by Django 5.0.6 on 2024-09-02 08:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('premium', '0002_add_bid_premium_bid_premium_add_premium'),
    ]

    operations = [
        migrations.AddField(
            model_name='premium',
            name='product',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
